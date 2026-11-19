import crypto from 'node:crypto';
import { db, withTransaction } from '../db/connection.ts';
import {
  AppError,
  getSiteSettingsBundle,
  mapOrderDetail,
  mapOrderItem,
  mapOrderStatusLog,
  mapVoucherRow,
  nowIso,
  type OrderDbRow,
  type OrderItemDbRow,
  type OrderStatusLogDbRow,
  type VoucherDbRow,
} from '../db/helpers.ts';
import {
  calculateShippingCost,
  resolveCombinedShippingClass,
} from './shippingService.ts';
import {
  ALLOWED_ORDER_TRANSITIONS,
  type AdminOrderStatusUpdateRequest,
  type AdminOrderStatusUpdateResponse,
  type CreateOrderRequest,
  type CreateOrderResponse,
  type OrderDetail,
  type OrderStatus,
  type OrderStatusLogItem,
  type PaymentInstruction,
  type PaymentMethodCode,
  type ShippingClass,
  type VoucherValidateResponse,
} from '../../shared/types.ts';

function formatRupiahPlain(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

export function evaluateVoucher(
  rawCode: string,
  subtotalIdr: number,
  shippingCostIdr?: number,
): VoucherValidateResponse & { voucherId?: number } {
  const normalizedCode = rawCode.trim().toUpperCase();
  const safeSubtotal = Math.max(0, Math.round(subtotalIdr));

  if (!normalizedCode) {
    return {
      valid: false,
      code: '',
      discountIdr: 0,
      finalSubtotalIdr: safeSubtotal,
      reason: 'Masukkan kode voucher terlebih dahulu.',
    };
  }

  const row = db
    .prepare('SELECT * FROM vouchers WHERE code = ? COLLATE NOCASE LIMIT 1')
    .get(normalizedCode) as VoucherDbRow | undefined;

  if (!row) {
    return {
      valid: false,
      code: normalizedCode,
      discountIdr: 0,
      finalSubtotalIdr: safeSubtotal,
      reason: 'Kode voucher tidak ditemukan. Periksa kembali ejaan kode Anda.',
    };
  }

  const voucher = mapVoucherRow(row);
  const nowMs = Date.now();

  if (!voucher.isActive) {
    return {
      valid: false,
      code: voucher.code,
      discountIdr: 0,
      finalSubtotalIdr: safeSubtotal,
      reason: 'Voucher ini sedang tidak aktif.',
    };
  }

  if (voucher.startsAt && Date.parse(voucher.startsAt) > nowMs) {
    return {
      valid: false,
      code: voucher.code,
      discountIdr: 0,
      finalSubtotalIdr: safeSubtotal,
      reason: 'Voucher ini belum memasuki periode aktif.',
    };
  }

  if (voucher.expiresAt && Date.parse(voucher.expiresAt) < nowMs) {
    return {
      valid: false,
      code: voucher.code,
      discountIdr: 0,
      finalSubtotalIdr: safeSubtotal,
      reason: 'Masa berlaku voucher ini telah berakhir.',
    };
  }

  if (voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses) {
    return {
      valid: false,
      code: voucher.code,
      discountIdr: 0,
      finalSubtotalIdr: safeSubtotal,
      reason: 'Kuota penggunaan voucher ini sudah habis.',
    };
  }

  if (safeSubtotal < voucher.minSubtotalIdr) {
    const diff = voucher.minSubtotalIdr - safeSubtotal;
    return {
      valid: false,
      code: voucher.code,
      discountIdr: 0,
      finalSubtotalIdr: safeSubtotal,
      reason: `Minimum belanja untuk voucher ${voucher.code} adalah ${formatRupiahPlain(voucher.minSubtotalIdr)}. Tambahkan ${formatRupiahPlain(diff)} lagi agar voucher dapat digunakan.`,
    };
  }

  if (voucher.code.toUpperCase() === 'KARGOFREE' && shippingCostIdr !== undefined && shippingCostIdr <= 0) {
    return {
      valid: false,
      code: voucher.code,
      discountIdr: 0,
      finalSubtotalIdr: safeSubtotal,
      reason: 'Voucher KARGOFREE hanya berlaku untuk pengiriman ekspedisi berbayar.',
    };
  }

  let discountIdr = 0;
  if (voucher.discountType === 'PERCENT') {
    discountIdr = Math.floor((safeSubtotal * voucher.discountValue) / 100);
    if (voucher.maxDiscountIdr !== null) {
      discountIdr = Math.min(discountIdr, voucher.maxDiscountIdr);
    }
  } else {
    discountIdr = voucher.discountValue;
    if (voucher.maxDiscountIdr !== null) {
      discountIdr = Math.min(discountIdr, voucher.maxDiscountIdr);
    }
  }

  if (voucher.code.toUpperCase() === 'KARGOFREE' && shippingCostIdr !== undefined) {
    discountIdr = Math.min(discountIdr, shippingCostIdr);
  } else {
    discountIdr = Math.min(discountIdr, safeSubtotal);
  }

  return {
    valid: true,
    code: voucher.code,
    discountIdr,
    finalSubtotalIdr: Math.max(0, safeSubtotal - discountIdr),
    voucherId: voucher.id,
    voucher: {
      code: voucher.code,
      description: voucher.description,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      maxDiscountIdr: voucher.maxDiscountIdr,
      minSubtotalIdr: voucher.minSubtotalIdr,
      expiresAt: voucher.expiresAt,
    },
  };
}

function generateInvoiceNumber(): string {
  const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = nowWib.getUTCFullYear();
  const m = String(nowWib.getUTCMonth() + 1).padStart(2, '0');
  const d = String(nowWib.getUTCDate()).padStart(2, '0');

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const candidate = `BRK-${y}${m}${d}-${suffix}`;
    const existing = db
      .prepare('SELECT id FROM orders WHERE invoice_number = ?')
      .get(candidate) as { id: number } | undefined;
    if (!existing) {
      return candidate;
    }
  }
  return `BRK-${y}${m}${d}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export function buildPaymentInstruction(
  method: PaymentMethodCode,
  invoiceNumber: string,
  amountIdr: number,
  createdAtIso: string,
  storeName: string,
  whatsappNumber: string,
): PaymentInstruction {
  const expiresAt = new Date(Date.parse(createdAtIso) + 24 * 60 * 60 * 1000).toISOString();
  const digitsSuffix = invoiceNumber.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');

  switch (method) {
    case 'VA_BCA':
      return {
        method,
        methodLabel: 'Virtual Account BCA',
        accountLabel: `${storeName} Virtual Account BCA`,
        accountNumber: `80777${digitsSuffix}`,
        amountIdr,
        expiresAt,
        note: `Transfer nominal tepat sesuai invoice ${invoiceNumber}. Verifikasi otomatis oleh tim operasional setelah dana masuk.`,
      };
    case 'VA_MANDIRI':
      return {
        method,
        methodLabel: 'Virtual Account Bank Mandiri',
        accountLabel: `${storeName} Virtual Account Mandiri`,
        accountNumber: `89022${digitsSuffix}`,
        amountIdr,
        expiresAt,
        note: `Selesaikan pembayaran melalui Livin atau ATM Mandiri sebelum batas waktu berakhir untuk menjaga alokasi stok.`,
      };
    case 'QRIS':
      return {
        method,
        methodLabel: 'QRIS Nasional',
        accountLabel: `${storeName} Armory QRIS`,
        accountNumber: `QRIS-${invoiceNumber}`,
        amountIdr,
        expiresAt,
        note: `Scan kode QRIS di kanal pembayaran Anda atau konfirmasikan bukti bayar ke WhatsApp armory (${whatsappNumber}).`,
      };
    case 'BANK_TRANSFER_ARMORY':
      return {
        method,
        methodLabel: 'Transfer Bank Resmi Armory',
        accountLabel: `PT Brakasa Tactical Indonesia (BCA)`,
        accountNumber: `5420-8819-44`,
        amountIdr,
        expiresAt,
        note: `Cantumkan nomor invoice ${invoiceNumber} pada berita transfer dan kirim bukti transfer ke ${whatsappNumber}.`,
      };
  }
}

export function fetchOrderDetailById(orderId: number): OrderDetail | null {
  const orderRow = db
    .prepare('SELECT * FROM orders WHERE id = ? LIMIT 1')
    .get(orderId) as OrderDbRow | undefined;
  if (!orderRow) {
    return null;
  }
  const itemRows = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .all(orderId) as unknown as OrderItemDbRow[];
  return mapOrderDetail(orderRow, itemRows.map(mapOrderItem));
}

export function fetchOrderTimeline(orderId: number): OrderStatusLogItem[] {
  const rows = db
    .prepare('SELECT * FROM order_status_logs WHERE order_id = ? ORDER BY created_at ASC, id ASC')
    .all(orderId) as unknown as OrderStatusLogDbRow[];
  return rows.map(mapOrderStatusLog);
}

export function createAtomicOrder(payload: CreateOrderRequest): CreateOrderResponse {
  if (!payload.items || payload.items.length === 0) {
    throw new AppError(400, 'EMPTY_CART', 'Keranjang pesanan tidak boleh kosong.');
  }

  const mergedQtyByProduct = new Map<number, number>();
  for (const item of payload.items) {
    const qty = Math.floor(item.quantity);
    if (!Number.isInteger(item.productId) || item.productId <= 0 || qty <= 0) {
      throw new AppError(400, 'INVALID_ORDER_ITEM', 'Format item dan kuantitas pesanan tidak valid.');
    }
    mergedQtyByProduct.set(item.productId, (mergedQtyByProduct.get(item.productId) ?? 0) + qty);
  }

  const { settings } = getSiteSettingsBundle();

  return withTransaction(() => {
    const resolvedItems: Array<{
      productId: number;
      sku: string;
      name: string;
      imageUrl: string;
      unitPriceIdr: number;
      weightGrams: number;
      quantity: number;
      lineTotalIdr: number;
      stockBefore: number;
      shippingClass: ShippingClass;
    }> = [];

    const insufficientDetails: Record<string, string> = {};

    for (const [productId, quantity] of mergedQtyByProduct.entries()) {
      const product = db
        .prepare(
          `SELECT id, sku, name, price_idr, weight_grams, stock_qty, is_active, deleted_at,
                  shipping_class
           FROM products
           WHERE id = ?
           LIMIT 1`,
        )
        .get(productId) as
        | {
            id: number;
            sku: string;
            name: string;
            price_idr: number;
            weight_grams: number;
            stock_qty: number;
            is_active: number;
            deleted_at: string | null;
            shipping_class: string;
          }
        | undefined;

      if (!product || Number(product.is_active) !== 1 || product.deleted_at !== null) {
        throw new AppError(
          404,
          'PRODUCT_UNAVAILABLE',
          `Produk dengan ID ${productId} tidak tersedia di katalog aktif.`,
        );
      }

      if (Number(product.stock_qty) < quantity) {
        insufficientDetails[product.sku] = `Stok untuk ${product.name} tersisa ${product.stock_qty} unit.`;
        continue;
      }

      const primaryImg = db
        .prepare(
          `SELECT url FROM product_media
           WHERE product_id = ? AND media_type = 'image'
           ORDER BY is_primary DESC, sort_order ASC, id ASC
           LIMIT 1`,
        )
        .get(productId) as { url: string } | undefined;

      resolvedItems.push({
        productId: Number(product.id),
        sku: product.sku,
        name: product.name,
        imageUrl: primaryImg?.url ?? '/media/images/products/brk-ar-001.jpg',
        unitPriceIdr: Number(product.price_idr),
        weightGrams: Number(product.weight_grams),
        quantity,
        lineTotalIdr: Number(product.price_idr) * quantity,
        stockBefore: Number(product.stock_qty),
        shippingClass: product.shipping_class as ShippingClass,
      });
    }

    if (Object.keys(insufficientDetails).length > 0) {
      const firstMessage = Object.values(insufficientDetails)[0];
      throw new AppError(409, 'OUT_OF_STOCK', firstMessage, insufficientDetails);
    }

    const subtotalIdr = resolvedItems.reduce((sum, item) => sum + item.lineTotalIdr, 0);
    const totalWeightGrams = resolvedItems.reduce(
      (sum, item) => sum + item.weightGrams * item.quantity,
      0,
    );
    const combinedShippingClass = resolveCombinedShippingClass(
      resolvedItems.map((item) => item.shippingClass),
    );

    const shippingCalc = calculateShippingCost({
      shippingSettings: settings.shippingSettings,
      shippingClass: combinedShippingClass,
      shippingZone: payload.shippingZone,
      shippingCourier: payload.shippingCourier,
      totalWeightGrams,
      woodenPacking: payload.woodenPacking,
    });

    let discountIdr = 0;
    let appliedVoucherCode: string | null = null;

    if (payload.voucherCode && payload.voucherCode.trim().length > 0) {
      const voucherResult = evaluateVoucher(
        payload.voucherCode,
        subtotalIdr,
        shippingCalc.shippingCostIdr,
      );
      if (!voucherResult.valid || !voucherResult.voucherId) {
        throw new AppError(
          400,
          'INVALID_VOUCHER',
          voucherResult.reason ?? 'Kode voucher tidak dapat diterapkan.',
        );
      }

      const voucherUpdate = db
        .prepare(
          `UPDATE vouchers
           SET used_count = used_count + 1, updated_at = ?
           WHERE id = ? AND is_active = 1 AND (max_uses IS NULL OR used_count < max_uses)`,
        )
        .run(nowIso(), voucherResult.voucherId);

      if (Number(voucherUpdate.changes) !== 1) {
        throw new AppError(
          409,
          'VOUCHER_QUOTA_EXCEEDED',
          'Kuota penggunaan voucher ini sudah habis saat transaksi diproses.',
        );
      }

      discountIdr = voucherResult.discountIdr;
      appliedVoucherCode = voucherResult.code;
    }

    const totalIdr = Math.max(
      0,
      subtotalIdr - discountIdr + shippingCalc.shippingCostIdr + shippingCalc.woodenPackingCostIdr,
    );

    const invoiceNumber = generateInvoiceNumber();
    const timestamp = nowIso();

    const deductStmt = db.prepare(
      `UPDATE products
       SET stock_qty = stock_qty - ?, updated_at = ?
       WHERE id = ? AND stock_qty >= ?`,
    );
    const mutationStmt = db.prepare(
      `INSERT INTO inventory_mutations (
        product_id, delta_qty, stock_before, stock_after, reason, reference_id, note, actor, created_at
      ) VALUES (?, ?, ?, ?, 'CHECKOUT_DEDUCT', ?, ?, 'system:checkout', ?)`,
    );

    for (const item of resolvedItems) {
      const deducted = deductStmt.run(item.quantity, timestamp, item.productId, item.quantity);
      if (Number(deducted.changes) !== 1) {
        throw new AppError(
          409,
          'OUT_OF_STOCK',
          `Stok untuk ${item.name} tidak mencukupi saat transaksi diproses.`,
        );
      }
      mutationStmt.run(
        item.productId,
        -item.quantity,
        item.stockBefore,
        item.stockBefore - item.quantity,
        invoiceNumber,
        `Pengurangan stok checkout pesanan ${invoiceNumber}`,
        timestamp,
      );
    }

    const orderInsert = db
      .prepare(
        `INSERT INTO orders (
          invoice_number, status, customer_name, customer_email, customer_phone,
          shipping_zone, shipping_city, shipping_district, shipping_postal_code,
          shipping_address, shipping_notes, shipping_courier, shipping_class,
          wooden_packing, wooden_packing_cost_idr, shipping_cost_idr, tracking_number,
          payment_method, subtotal_idr, discount_idr, total_idr, voucher_code,
          requires_age_18, buyer_dob, buyer_age_years, age_18_confirmed,
          sport_use_declaration, club_kta_number, usage_purpose,
          stock_restored, cancel_reason, created_at, updated_at
        ) VALUES (
          ?, 'PENDING_PAYMENT', ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, NULL,
          ?, ?, ?, ?, ?,
          0, NULL, NULL, 0,
          0, NULL, NULL,
          0, NULL, ?, ?
        )`,
      )
      .run(
        invoiceNumber,
        payload.customerName.trim(),
        payload.customerEmail.trim().toLowerCase(),
        payload.customerPhone.trim(),
        payload.shippingZone,
        payload.shippingCity.trim(),
        payload.shippingDistrict.trim(),
        payload.shippingPostalCode.trim(),
        payload.shippingAddress.trim(),
        payload.shippingNotes?.trim() ? payload.shippingNotes.trim() : null,
        shippingCalc.courier.code,
        combinedShippingClass,
        shippingCalc.woodenPacking ? 1 : 0,
        shippingCalc.woodenPackingCostIdr,
        shippingCalc.shippingCostIdr,
        payload.paymentMethod,
        subtotalIdr,
        discountIdr,
        totalIdr,
        appliedVoucherCode,
        timestamp,
        timestamp,
      );

    const orderId = Number(orderInsert.lastInsertRowid);

    const insertOrderItem = db.prepare(
      `INSERT INTO order_items (
        order_id, product_id, sku_snapshot, name_snapshot, image_url_snapshot,
        unit_price_idr, weight_grams_snapshot, quantity, line_total_idr
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const item of resolvedItems) {
      insertOrderItem.run(
        orderId,
        item.productId,
        item.sku,
        item.name,
        item.imageUrl,
        item.unitPriceIdr,
        item.weightGrams,
        item.quantity,
        item.lineTotalIdr,
      );
    }

    db.prepare(
      `INSERT INTO order_status_logs (order_id, from_status, to_status, note, actor, created_at)
       VALUES (?, NULL, 'PENDING_PAYMENT', ?, 'system:checkout', ?)`,
    ).run(
      orderId,
      `Invoice ${invoiceNumber} diterbitkan. Menunggu verifikasi pembayaran.`,
      timestamp,
    );

    const order = fetchOrderDetailById(orderId);
    if (!order) {
      throw new AppError(500, 'ORDER_READ_FAILED', 'Gagal membaca data pesanan yang baru dibuat.');
    }

    const paymentInstruction = buildPaymentInstruction(
      payload.paymentMethod,
      order.invoiceNumber,
      order.totalIdr,
      order.createdAt,
      settings.armoryProfile.storeName,
      settings.armoryProfile.whatsappNumber,
    );

    return { order, paymentInstruction };
  });
}

export function updateAdminOrderStatus(
  orderId: number,
  payload: AdminOrderStatusUpdateRequest,
  adminUsername: string,
): AdminOrderStatusUpdateResponse {
  return withTransaction(() => {
    const existing = db
      .prepare('SELECT * FROM orders WHERE id = ? LIMIT 1')
      .get(orderId) as OrderDbRow | undefined;

    if (!existing) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.');
    }

    const currentStatus = existing.status as OrderStatus;
    const nextStatus = payload.nextStatus;

    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      throw new AppError(
        409,
        currentStatus === 'CANCELLED' ? 'ORDER_ALREADY_CANCELLED' : 'TERMINAL_ORDER_STATUS',
        `Pesanan dengan status ${currentStatus} sudah bersifat final dan tidak dapat diubah.`,
      );
    }

    const allowedNext = ALLOWED_ORDER_TRANSITIONS[currentStatus] ?? [];
    if (!allowedNext.includes(nextStatus)) {
      throw new AppError(
        409,
        'INVALID_STATUS_TRANSITION',
        `Transisi status dari ${currentStatus} ke ${nextStatus} tidak diizinkan.`,
      );
    }

    const timestamp = nowIso();
    let restockedItemsCount = 0;

    if (nextStatus === 'SHIPPED') {
      const tracking = payload.trackingNumber?.trim() ?? '';
      if (tracking.length < 5) {
        throw new AppError(
          400,
          'TRACKING_NUMBER_REQUIRED',
          'Masukkan nama ekspedisi dan nomor resi kargo yang sah (minimal 5 karakter) sebelum mengubah status pesanan ke Dikirim.',
        );
      }

      const courierToSave = payload.shippingCourier ?? (existing.shipping_courier as string);
      db.prepare(
        `UPDATE orders
         SET status = 'SHIPPED',
             shipping_courier = ?,
             tracking_number = ?,
             updated_at = ?
         WHERE id = ?`,
      ).run(courierToSave, tracking, timestamp, orderId);

      const logNote =
        payload.note?.trim() || `Pesanan dikirim via ${courierToSave} dengan nomor resi ${tracking}.`;
      db.prepare(
        `INSERT INTO order_status_logs (order_id, from_status, to_status, note, actor, created_at)
         VALUES (?, ?, 'SHIPPED', ?, ?, ?)`,
      ).run(orderId, currentStatus, logNote, adminUsername, timestamp);
    } else if (nextStatus === 'CANCELLED') {
      const cancelReason = payload.cancelReason?.trim() || payload.note?.trim() || '';
      if (cancelReason.length < 5) {
        throw new AppError(
          400,
          'CANCEL_REASON_REQUIRED',
          'Tuliskan alasan pembatalan pesanan (minimal 5 karakter) agar tercatat pada riwayat transaksi dan pengembalian stok.',
        );
      }

      const cancelGuard = db
        .prepare(
          `UPDATE orders
           SET status = 'CANCELLED',
               stock_restored = 1,
               cancel_reason = ?,
               updated_at = ?
           WHERE id = ?
             AND status IN ('PENDING_PAYMENT', 'PAID_VERIFIED', 'PACKED')
             AND stock_restored = 0`,
        )
        .run(cancelReason, timestamp, orderId);

      if (Number(cancelGuard.changes) !== 1) {
        throw new AppError(
          409,
          'ORDER_ALREADY_CANCELLED',
          'Pesanan sudah dibatalkan dan stok telah dikembalikan sebelumnya.',
        );
      }

      const orderItems = db
        .prepare('SELECT * FROM order_items WHERE order_id = ?')
        .all(orderId) as unknown as OrderItemDbRow[];

      const selectStock = db.prepare('SELECT stock_qty FROM products WHERE id = ? LIMIT 1');
      const addStock = db.prepare(
        'UPDATE products SET stock_qty = stock_qty + ?, updated_at = ? WHERE id = ?',
      );
      const insertRestockMutation = db.prepare(
        `INSERT INTO inventory_mutations (
          product_id, delta_qty, stock_before, stock_after, reason, reference_id, note, actor, created_at
        ) VALUES (?, ?, ?, ?, 'ORDER_CANCEL_RESTOCK', ?, ?, ?, ?)`,
      );

      for (const item of orderItems) {
        if (item.product_id === null) {
          continue;
        }
        const prodRow = selectStock.get(item.product_id) as { stock_qty: number } | undefined;
        if (!prodRow) {
          continue;
        }
        const stockBefore = Number(prodRow.stock_qty);
        const qty = Number(item.quantity);
        addStock.run(qty, timestamp, item.product_id);
        insertRestockMutation.run(
          item.product_id,
          qty,
          stockBefore,
          stockBefore + qty,
          existing.invoice_number,
          `Pengembalian stok otomatis karena pembatalan ${existing.invoice_number}: ${cancelReason}`,
          adminUsername,
          timestamp,
        );
        restockedItemsCount += qty;
      }

      db.prepare(
        `INSERT INTO order_status_logs (order_id, from_status, to_status, note, actor, created_at)
         VALUES (?, ?, 'CANCELLED', ?, ?, ?)`,
      ).run(orderId, currentStatus, `Dibatalkan: ${cancelReason}`, adminUsername, timestamp);
    } else {
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(
        nextStatus,
        timestamp,
        orderId,
      );

      const defaultNote =
        nextStatus === 'PAID_VERIFIED'
          ? 'Pembayaran telah diverifikasi oleh tim Brakasa Tactical.'
          : nextStatus === 'PACKED'
            ? 'Pesanan sedang dikemas dan siap dikirim.'
            : 'Pesanan selesai diterima pembeli.';

      db.prepare(
        `INSERT INTO order_status_logs (order_id, from_status, to_status, note, actor, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        orderId,
        currentStatus,
        nextStatus,
        payload.note?.trim() || defaultNote,
        adminUsername,
        timestamp,
      );
    }

    const updatedOrder = fetchOrderDetailById(orderId);
    if (!updatedOrder) {
      throw new AppError(500, 'ORDER_READ_FAILED', 'Gagal membaca pembaruan pesanan.');
    }
    const timeline = fetchOrderTimeline(orderId);
    return {
      order: updatedOrder,
      timeline,
      restockedItemsCount,
    };
  });
}
