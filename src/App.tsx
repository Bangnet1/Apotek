import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowDownToLine, Bell, Boxes, CalendarClock, Check,
  ChevronDown, CircleHelp, ClipboardList, FileSpreadsheet, LayoutDashboard,
  LogOut, Menu, Package, Plus, Search, Settings, ShieldCheck, Store, Truck,
  UserRound, Users, X
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import type { Batch, Category, Product, Profile, Supplier } from './types'
import * as XLSX from 'xlsx'

type Page = 'Dashboard' | 'Produk & Kategori' | 'Stok & Expired' | 'Supplier' | 'Pengaturan'
const money = (n:number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n || 0)
const sampleProducts: Product[] = [
  {id:'demo-1',sku:'MG-0001',barcode:'899000000001',name:'Paracetamol 500 mg',brand:'Generik',category_id:'c1',medicine_type:'Obat Bebas',unit:'Strip',purchase_price:3500,selling_price:5000,min_stock:10,is_active:true},
  {id:'demo-2',sku:'MG-0002',barcode:'899000000002',name:'Vitamin C 500 mg',brand:'Generik',category_id:'c2',medicine_type:'Suplemen',unit:'Botol',purchase_price:12000,selling_price:18000,min_stock:5,is_active:true},
  {id:'demo-3',sku:'MG-0003',barcode:'899000000003',name:'Alkohol 70%',brand:'Onemed',category_id:'c3',medicine_type:'Alat Kesehatan',unit:'Botol',purchase_price:9000,selling_price:13000,min_stock:5,is_active:true}
]
const demoBatches: Batch[] = [
  {id:'b1',product_id:'demo-1',batch_number:'PCM-2401',expiry_date:'2026-12-10',quantity_available:8,purchase_price:3500},
  {id:'b2',product_id:'demo-2',batch_number:'VTC-2402',expiry_date:'2027-01-20',quantity_available:22,purchase_price:12000},
  {id:'b3',product_id:'demo-3',batch_number:'ALK-2403',expiry_date:'2027-06-01',quantity_available:4,purchase_price:9000}
]
const nav: {name:Page; icon:typeof LayoutDashboard; group:string}[] = [
  {name:'Dashboard',icon:LayoutDashboard,group:'UTAMA'},
  {name:'Produk & Kategori',icon:Package,group:'INVENTARIS'},
  {name:'Stok & Expired',icon:Boxes,group:'INVENTARIS'},
  {name:'Supplier',icon:Truck,group:'OPERASIONAL'},
  {name:'Pengaturan',icon:Settings,group:'SISTEM'}
]

function App(){
  const [page,setPage]=useState<Page>('Dashboard')
  const [profile,setProfile]=useState<Profile|null>(null)
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [loginError,setLoginError]=useState('')
  const [loading,setLoading]=useState(false)
  const [products,setProducts]=useState<Product[]>(sampleProducts)
  const [batches,setBatches]=useState<Batch[]>(demoBatches)
  const [suppliers,setSuppliers]=useState<Supplier[]>([])
  const [categories,setCategories]=useState<Category[]>([])
  const [search,setSearch]=useState('')
  const [showAdd,setShowAdd]=useState(false)
  const [mobileNav,setMobileNav]=useState(false)
  const [toast,setToast]=useState('')
  const [connected,setConnected]=useState(false)
  const [importRows,setImportRows]=useState<Record<string,unknown>[]>([])
  const [showImport,setShowImport]=useState(false)

  useEffect(()=>{ if(!supabase) return; supabase.auth.getSession().then(({data})=>{if(data.session) loadProfile(data.session.user.id)}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>{if(session) loadProfile(session.user.id); else setProfile(null)}); return ()=>subscription.unsubscribe() },[])
  useEffect(()=>{ if(profile && supabase) loadData() },[profile])
  async function loadProfile(id:string){
    if(!supabase) return
    const {data,error}=await supabase.from('profiles').select('id,full_name,role').eq('id',id).single()
    if(error){setLoginError('Profil belum dibuat. Minta pemilik menambahkan profil dan role di Supabase.');return}
    setProfile(data as Profile);setLoginError('')
  }
  async function loadData(){
    if(!supabase)return
    const [p,b,s,c]=await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('product_batches').select('*').order('expiry_date'),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('categories').select('*').order('name')
    ])
    if(!p.error)setProducts(p.data as Product[])
    if(!b.error)setBatches(b.data as Batch[])
    if(!s.error)setSuppliers(s.data as Supplier[])
    if(!c.error)setCategories(c.data as Category[])
    setConnected(true)
  }
  async function login(e:React.FormEvent){
    e.preventDefault();setLoginError('')
    if(!supabase){setLoginError('Konfigurasi Supabase belum diisi. Lengkapi .env.local terlebih dahulu.');return}
    setLoading(true);const {error}=await supabase.auth.signInWithPassword({email,password});setLoading(false)
    if(error)setLoginError(error.message)
  }
  async function logout(){await supabase?.auth.signOut();setProfile(null)}
  function notify(message:string){setToast(message);window.setTimeout(()=>setToast(''),3200)}
  const totalStock=batches.reduce((a,b)=>a+b.quantity_available,0)
  const lowStock=products.filter(p=>batches.filter(b=>b.product_id===p.id).reduce((a,b)=>a+b.quantity_available,0)<=p.min_stock).length
  const expiring=batches.filter(b=>{const d=(new Date(b.expiry_date).getTime()-Date.now())/86400000;return d>=0&&d<=90}).length
  const filtered=useMemo(()=>products.filter(p=>(p.name+' '+p.sku+' '+(p.barcode||'')).toLowerCase().includes(search.toLowerCase())),[products,search])

  if(!profile) return <div className="login-wrap"><div className="login-card"><div className="brand-mark"><Store size={25}/></div><div className="eyebrow">PHARMACY MANAGEMENT SYSTEM</div><h1>Mantri <span>Gemoy</span></h1><p className="muted">Masuk ke dashboard operasional apotek Anda.</p><form onSubmit={login} className="login-form"><label>Email pengguna</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@apotek.com" required/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password" required/><button className="btn-primary full" disabled={loading}>{loading?'Memproses...':'Masuk ke Dashboard'}</button>{loginError&&<div className="error-box">{loginError}</div>}</form><div className="login-foot"><ShieldCheck size={15}/> Akses khusus pemilik, kasir, dan apoteker</div>{!isSupabaseConfigured&&<div className="demo-note">Mode pratinjau: hubungkan Supabase untuk mengaktifkan login dan data.</div>}</div></div>

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}><div className="brand"><div className="brand-mark small"><Store size={20}/></div><div><strong>MANTRI <span>GEMOY</span></strong><small>PHARMACY SYSTEM</small></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X/></button></div>
      <div className="branch-chip"><span className="live-dot"/> Apotek Utama · Karawang</div>
      {['UTAMA','INVENTARIS','OPERASIONAL','SISTEM'].map(group=><div className="nav-group" key={group}><div className="nav-label">{group}</div>{nav.filter(n=>n.group===group).map(n=><button key={n.name} className={`nav-item ${page===n.name?'active':''}`} onClick={()=>{setPage(n.name);setMobileNav(false)}}><n.icon size={18}/><span>{n.name}</span>{n.name==='Stok & Expired'&&expiring>0&&<i className="nav-count">{expiring}</i>}</button>)}</div>)}
      <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={18}/><div><b>Butuh bantuan?</b><small>Panduan penggunaan sistem</small></div></div><div className="user-card"><div className="avatar">{profile.full_name?.slice(0,1)||'M'}</div><div className="user-meta"><b>{profile.full_name}</b><small>{profile.role}</small></div><button title="Keluar" onClick={logout}><LogOut size={17}/></button></div></div>
    </aside>
    {mobileNav&&<div className="scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu/></button><div className="crumb">Mantri Gemoy <span>/</span> <b>{page}</b></div><div className="top-actions"><div className="connection"><span className={connected?'live-dot':'idle-dot'}/>{connected?'Database terhubung':'Menunggu koneksi'}</div><button className="icon-btn" title="Notifikasi"><Bell size={19}/><i/></button><div className="top-avatar">{profile.full_name?.slice(0,1)||'M'}</div></div></header>
      <div className="page-content"><div className="page-heading"><div><div className="eyebrow">JUMAT, 06 NOVEMBER 2026</div><h2>{page==='Dashboard'?'Selamat datang kembali':page}</h2><p>{page==='Dashboard'?'Berikut ringkasan operasional Apotek Mantri Gemoy.':'Kelola data apotek dengan pencatatan yang rapi dan terkontrol.'}</p></div><div className="heading-actions"><button className="btn-outline" onClick={()=>loadData()}><Activity size={16}/> Refresh</button>{page==='Produk & Kategori'&&<><button className="btn-outline" onClick={()=>setShowImport(true)}><FileSpreadsheet size={16}/> Import Excel</button><button className="btn-primary" onClick={()=>setShowAdd(true)}><Plus size={17}/> Tambah Produk</button></>}</div></div>
      {page==='Dashboard'&&<Dashboard products={products} batches={batches} totalStock={totalStock} lowStock={lowStock} expiring={expiring}/>}
      {page==='Produk & Kategori'&&<Products products={filtered} categories={categories} search={search} setSearch={setSearch} onAdd={()=>setShowAdd(true)} onImport={()=>setShowImport(true)}/>}
      {page==='Stok & Expired'&&<Stock products={products} batches={batches}/>}
      {page==='Supplier'&&<Suppliers suppliers={suppliers} onRefresh={loadData} notify={notify}/>}
      {page==='Pengaturan'&&<SettingsPage profile={profile} connected={connected}/>}
      <footer className="footer">© 2026 Mantri Gemoy · Pharmacy Management System <span>Versi awal 0.1.0</span></footer></div>
    </main>
    {showAdd&&<AddProduct categories={categories} onClose={()=>setShowAdd(false)} onSaved={()=>{setShowAdd(false);loadData();notify('Produk berhasil disimpan')}}/>}
    {showImport&&<ImportStock onClose={()=>{setShowImport(false);setImportRows([])}} rows={importRows} setRows={setImportRows} onDone={()=>{setShowImport(false);setImportRows([]);loadData();notify('Impor stok selesai')}}/>}
    {toast&&<div className="toast"><Check size={17}/>{toast}</div>}
  </div>
}

function Dashboard({products,batches,totalStock,lowStock,expiring}:{products:Product[];batches:Batch[];totalStock:number;lowStock:number;expiring:number}){
  const sales=[{day:'Sen',value:1.4},{day:'Sel',value:2.1},{day:'Rab',value:1.8},{day:'Kam',value:2.6},{day:'Jum',value:2.2},{day:'Sab',value:3.1},{day:'Min',value:2.5}]
  return <><div className="stats-grid"><Stat icon={Package} label="Total Produk Aktif" value={products.filter(p=>p.is_active).length.toString()} note="Produk terdaftar" tone="teal"/><Stat icon={Boxes} label="Total Stok" value={totalStock.toLocaleString('id-ID')} note="Unit dari seluruh batch" tone="blue"/><Stat icon={AlertTriangle} label="Stok Menipis" value={lowStock.toString()} note="Perlu pemeriksaan" tone="orange"/><Stat icon={CalendarClock} label="Mendekati Expired" value={expiring.toString()} note="Dalam 90 hari" tone="red"/></div>
    <div className="dashboard-grid"><section className="panel sales-panel"><div className="panel-head"><div><h3>Ringkasan Penjualan</h3><p>Visual contoh untuk tampilan tahap pertama</p></div><span className="period-pill">7 hari terakhir <ChevronDown size={14}/></span></div><div className="chart-placeholder"><div className="chart-y"><span>Rp 4 jt</span><span>Rp 3 jt</span><span>Rp 2 jt</span><span>Rp 1 jt</span><span>Rp 0</span></div><div className="chart-bars">{sales.map(s=><div className="bar-col" key={s.day}><div className="bar" style={{height:`${s.value/4*100}%`}}/><small>{s.day}</small></div>)}</div></div><div className="chart-legend"><span/> Data penjualan akan muncul setelah modul POS aktif</div></section>
      <section className="panel"><div className="panel-head"><div><h3>Perlu Perhatian</h3><p>Pemantauan inventaris</p></div><AlertTriangle size={18} className="warning-icon"/></div><div className="attention-list"><div><span className="attention-icon orange"><AlertTriangle size={17}/></span><div><b>{lowStock} produk stok menipis</b><small>Periksa batas minimum stok</small></div></div><div><span className="attention-icon red"><CalendarClock size={17}/></span><div><b>{expiring} batch mendekati expired</b><small>Dalam rentang 90 hari</small></div></div><div><span className="attention-icon teal"><Truck size={17}/></span><div><b>Data supplier</b><small>Pastikan pemasok terdaftar</small></div></div></div></section></div>
    <section className="panel"><div className="panel-head"><div><h3>Batch dengan Expired Terdekat</h3><p>Urutan berdasarkan tanggal kedaluwarsa</p></div><span className="text-link">Lihat inventaris</span></div><div className="table-wrap"><table><thead><tr><th>PRODUK</th><th>NOMOR BATCH</th><th>TANGGAL EXPIRED</th><th>SISA STOK</th><th>STATUS</th></tr></thead><tbody>{[...batches].sort((a,b)=>a.expiry_date.localeCompare(b.expiry_date)).slice(0,5).map(b=>{const p=products.find(x=>x.id===b.product_id);const days=Math.ceil((new Date(b.expiry_date).getTime()-Date.now())/86400000);return <tr key={b.id}><td><b>{p?.name||'Produk'}</b><small>{p?.sku||'-'}</small></td><td>{b.batch_number}</td><td>{new Date(b.expiry_date).toLocaleDateString('id-ID')}</td><td>{b.quantity_available}</td><td><span className={`status ${days<=30?'danger':days<=90?'warning':'good'}`}>{days<0?'Expired':days<=30?'Prioritas':days<=90?'Pantau':'Aman'}</span></td></tr>})}</tbody></table></div></section>
  </>
}
function Stat({icon:Icon,label,value,note,tone}:{icon:typeof Package;label:string;value:string;note:string;tone:string}){return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>}
function Products({products,categories,search,setSearch,onAdd,onImport}:{products:Product[];categories:Category[];search:string;setSearch:(s:string)=>void;onAdd:()=>void;onImport:()=>void}){return <section className="panel"><div className="panel-head"><div><h3>Daftar Produk</h3><p>{products.length} produk ditemukan</p></div><div className="table-tools"><div className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, SKU, barcode..."/></div><button className="btn-outline compact" onClick={onImport}><FileSpreadsheet size={15}/> Import</button><button className="btn-primary compact" onClick={onAdd}><Plus size={15}/> Produk</button></div></div><div className="table-wrap"><table><thead><tr><th>PRODUK</th><th>SKU / BARCODE</th><th>KATEGORI</th><th>JENIS</th><th>HARGA JUAL</th><th>MIN. STOK</th><th>STATUS</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b><small>{p.brand||'Tanpa merek'} · {p.unit}</small></td><td>{p.sku}<small>{p.barcode||'-'}</small></td><td>{categories.find(c=>c.id===p.category_id)?.name||'Belum dikategorikan'}</td><td>{p.medicine_type}</td><td><b>{money(p.selling_price)}</b></td><td>{p.min_stock}</td><td><span className={`status ${p.is_active?'good':'muted-status'}`}>{p.is_active?'Aktif':'Nonaktif'}</span></td></tr>)}</tbody></table>{products.length===0&&<div className="empty-state">Produk belum ditemukan. Tambahkan produk atau impor template Excel.</div>}</div></section>}
function Stock({products,batches}:{products:Product[];batches:Batch[]}){return <section className="panel"><div className="panel-head"><div><h3>Kontrol Batch & Kedaluwarsa</h3><p>Stok per batch untuk penerapan FEFO</p></div><span className="period-pill">Ambang peringatan 90 hari</span></div><div className="table-wrap"><table><thead><tr><th>NAMA PRODUK</th><th>BATCH</th><th>EXPIRED</th><th>STOK TERSEDIA</th><th>HARGA MODAL</th><th>STATUS</th></tr></thead><tbody>{batches.map(b=>{const p=products.find(x=>x.id===b.product_id);const days=Math.ceil((new Date(b.expiry_date).getTime()-Date.now())/86400000);return <tr key={b.id}><td><b>{p?.name||'Produk'}</b><small>{p?.sku||''}</small></td><td>{b.batch_number}</td><td>{new Date(b.expiry_date).toLocaleDateString('id-ID')}</td><td>{b.quantity_available}</td><td>{money(b.purchase_price)}</td><td><span className={`status ${days<0?'danger':days<=30?'danger':days<=90?'warning':'good'}`}>{days<0?'Kedaluwarsa':days<=30?'H-30':days<=90?'H-90':'Aman'}</span></td></tr>})}</tbody></table>{!batches.length&&<div className="empty-state">Belum ada data batch.</div>}</div></section>}
function Suppliers({suppliers,onRefresh,notify}:{suppliers:Supplier[];onRefresh:()=>void;notify:(s:string)=>void}){const [name,setName]=useState('');const [phone,setPhone]=useState('');const [address,setAddress]=useState('');async function add(e:React.FormEvent){e.preventDefault();if(!supabase){notify('Hubungkan Supabase terlebih dahulu');return}const {error}=await supabase.from('suppliers').insert({name,phone,address});if(error)notify(error.message);else{name&&setName('');setPhone('');setAddress('');onRefresh();notify('Supplier ditambahkan')}}return <div className="two-col"><section className="panel"><div className="panel-head"><div><h3>Tambah Supplier</h3><p>Catat distributor atau pemasok resmi</p></div></div><form className="form-grid" onSubmit={add}><label>Nama supplier<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Nama perusahaan"/></label><label>Nomor telepon<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="08xx..."/></label><label className="span-2">Alamat<textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="Alamat supplier"/></label><button className="btn-primary" type="submit"><Plus size={16}/> Simpan Supplier</button></form></section><section className="panel"><div className="panel-head"><div><h3>Daftar Supplier</h3><p>{suppliers.length} pemasok terdaftar</p></div></div>{suppliers.map(s=><div className="supplier-row" key={s.id}><div className="supplier-icon"><Truck/></div><div><b>{s.name}</b><small>{s.phone||'No. telepon belum diisi'} · {s.address||'Alamat belum diisi'}</small></div></div>)}{!suppliers.length&&<div className="empty-state">Belum ada supplier. Tambahkan supplier resmi untuk memulai.</div>}</section></div>}
function AddProduct({categories,onClose,onSaved}:{categories:Category[];onClose:()=>void;onSaved:()=>void}){const [v,setV]=useState({sku:'',barcode:'',name:'',brand:'',category_id:'',medicine_type:'Obat Bebas',unit:'Strip',purchase_price:'',selling_price:'',min_stock:'5'});const [err,setErr]=useState('');async function save(e:React.FormEvent){e.preventDefault();if(!supabase){setErr('Supabase belum dikonfigurasi');return}const {error}=await supabase.from('products').insert({...v,purchase_price:Number(v.purchase_price),selling_price:Number(v.selling_price),min_stock:Number(v.min_stock),category_id:v.category_id||null});if(error)setErr(error.message);else onSaved()}return <Modal title="Tambah Produk Baru" onClose={onClose}><form className="form-grid modal-form" onSubmit={save}>{[['sku','SKU / Kode Produk'],['barcode','Barcode'],['name','Nama Produk'],['brand','Merek'],['purchase_price','Harga Beli'],['selling_price','Harga Jual'],['min_stock','Minimum Stok'],['unit','Satuan']].map(([k,l])=><label key={k}>{l}<input required={['sku','name','purchase_price','selling_price'].includes(k)} value={(v as any)[k]} onChange={e=>setV({...v,[k]:e.target.value})}/></label>)}<label>Kategori<select value={v.category_id} onChange={e=>setV({...v,category_id:e.target.value})}><option value="">Pilih kategori</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Jenis obat<select value={v.medicine_type} onChange={e=>setV({...v,medicine_type:e.target.value})}>{['Obat Bebas','Obat Bebas Terbatas','Obat Keras','Suplemen','Alat Kesehatan','Produk Lain'].map(x=><option key={x}>{x}</option>)}</select></label>{err&&<div className="error-box span-2">{err}</div>}<div className="modal-actions span-2"><button type="button" className="btn-outline" onClick={onClose}>Batal</button><button className="btn-primary">Simpan Produk</button></div></form></Modal>}
function ImportStock({onClose,rows,setRows,onDone}:{onClose:()=>void;rows:Record<string,unknown>[];setRows:(r:Record<string,unknown>[])=>void;onDone:()=>void}){const [err,setErr]=useState('');const [busy,setBusy]=useState(false);function read(file?:File){if(!file)return;const reader=new FileReader();reader.onload=e=>{const wb=XLSX.read(e.target?.result,{type:'array',cellDates:false});const data=XLSX.utils.sheet_to_json<Record<string,unknown>>(wb.Sheets[wb.SheetNames[0]],{defval:''});setRows(data);setErr('')};reader.readAsArrayBuffer(file)}async function submit(){if(!supabase){setErr('Supabase belum dikonfigurasi');return}if(!rows.length)return;setBusy(true);try{for(const [i,r] of rows.entries()){const required=['sku','nama_produk','jenis_obat','satuan','harga_beli','harga_jual','stok_awal','nomor_batch','tanggal_expired'];const missing=required.filter(k=>String(r[k]??'').trim()==='');if(missing.length)throw new Error(`Baris ${i+2}: kolom ${missing.join(', ')} wajib diisi`);let categoryId:string|null=null;const catName=String(r.kategori||'Umum');let {data:cat}=await supabase.from('categories').select('id').eq('name',catName).maybeSingle();if(!cat){const ins=await supabase.from('categories').insert({name:catName}).select('id').single();if(ins.error)throw ins.error;cat=ins.data}categoryId=cat.id;let {data:p}=await supabase.from('products').select('id').eq('sku',String(r.sku)).maybeSingle();if(!p){const ins=await supabase.from('products').insert({sku:String(r.sku),barcode:String(r.barcode||'')||null,name:String(r.nama_produk),brand:String(r.merek||'')||null,category_id:categoryId,medicine_type:String(r.jenis_obat),unit:String(r.satuan),purchase_price:Number(r.harga_beli),selling_price:Number(r.harga_jual),min_stock:Number(r.minimum_stok||0)}).select('id').single();if(ins.error)throw ins.error;p=ins.data}const batch=await supabase.from('product_batches').insert({product_id:p.id,batch_number:String(r.nomor_batch),expiry_date:String(r.tanggal_expired).slice(0,10),quantity_received:Number(r.stok_awal),quantity_available:Number(r.stok_awal),purchase_price:Number(r.harga_beli)}).select('id').single();if(batch.error)throw batch.error;const move=await supabase.from('stock_movements').insert({product_id:p.id,batch_id:batch.data.id,movement_type:'opening',quantity_change:Number(r.stok_awal),notes:'Impor stok awal Excel'});if(move.error)throw move.error}onDone()}catch(e){setErr(e instanceof Error?e.message:'Gagal mengimpor data')}finally{setBusy(false)}}return <Modal title="Import Stok Awal dari Excel" onClose={onClose}><div className="import-area"><FileSpreadsheet size={30}/><b>Pilih file Excel (.xlsx / .xls)</b><small>Gunakan template stok awal Mantri Gemoy.</small><input type="file" accept=".xlsx,.xls,.csv" onChange={e=>read(e.target.files?.[0])}/></div>{rows.length>0&&<><p className="muted">{rows.length} baris siap ditinjau</p><div className="table-wrap preview-table"><table><thead><tr>{Object.keys(rows[0]).slice(0,6).map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{rows.slice(0,5).map((r,i)=><tr key={i}>{Object.keys(rows[0]).slice(0,6).map(k=><td key={k}>{String(r[k])}</td>)}</tr>)}</tbody></table></div></>}{err&&<div className="error-box">{err}</div>}<div className="modal-actions"><button className="btn-outline" onClick={onClose}>Batal</button><button className="btn-primary" disabled={!rows.length||busy} onClick={submit}>{busy?'Mengimpor...':`Impor ${rows.length} baris`}</button></div></Modal>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal"><div className="modal-title"><h3>{title}</h3><button onClick={onClose}><X/></button></div>{children}</div></div>}
function SettingsPage({profile,connected}:{profile:Profile;connected:boolean}){return <div className="two-col"><section className="panel"><div className="panel-head"><div><h3>Profil Pengguna</h3><p>Informasi akun yang sedang aktif</p></div><UserRound/></div><div className="settings-row"><span>Nama</span><b>{profile.full_name}</b></div><div className="settings-row"><span>Peran</span><b>{profile.role}</b></div><div className="settings-row"><span>Status database</span><b>{connected?'Terhubung':'Belum terhubung'}</b></div></section><section className="panel"><div className="panel-head"><div><h3>Informasi Apotek</h3><p>Konfigurasi dasar cabang</p></div><Store/></div><div className="settings-row"><span>Nama usaha</span><b>Mantri Gemoy</b></div><div className="settings-row"><span>Lokasi</span><b>Karawang, Jawa Barat</b></div><div className="settings-row"><span>Cabang</span><b>Apotek Utama</b></div><div className="settings-row"><span>Printer struk</span><b>Belum dikonfigurasi</b></div></section></div>}
export default App
