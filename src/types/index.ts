export type Role = 'owner' | 'cashier' | 'pharmacist'
export type Profile = { id: string; full_name: string; role: Role }
export type Product = {
  id: string; sku: string; barcode: string | null; name: string; brand: string | null
  category_id: string | null; medicine_type: string; unit: string
  purchase_price: number; selling_price: number; min_stock: number; is_active: boolean
}
export type Batch = {
  id: string; product_id: string; batch_number: string; expiry_date: string
  quantity_available: number; purchase_price: number
}
export type Supplier = { id: string; name: string; phone: string | null; address: string | null }
export type Category = { id: string; name: string }
