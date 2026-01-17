import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import db from '../db/index.js'

const supplierRoutes = new Hono()
type Supplier = {
    SupplierID: number
    Name:  string
    Contact: string | null
    Address: string | null
    Email: string | null
    Phone: string | null
}
const createdsupplierSchema = z.object({
    Name: z.string().min(1, "ชื่อสั้นไปลูกพี่"),
    Contact: z.string().optional(),
    Address: z.string().optional(),
    Email: z.string().optional(),
    Phone: z.string().optional(),

})
const updatesupplierSchema = z.object({
    Name: z.string().min(1, "ชื่อสั้นไปลูกพี่"),
    Contact: z.string().optional(),
    Address: z.string().optional(),
    Email: z.string().optional(),
    Phone: z.string().optional(),
})

supplierRoutes.post('/',
  zValidator('json', createdsupplierSchema)
  , async (c) => {
    const body = await c.req.json<Omit<Supplier,"SupplierID">>()
    let sql = `INSERT INTO Supplier (Name, Contact, Address, Email, Phone)
      VALUES(@Name, @Contact, @Address, @Email, @Phone);
    `
    let stmt = db.prepare<Omit<Supplier,"SupplierID">>(sql)
    let result = stmt.run(body)

    if (result.changes === 0) {
      return c.json({ message: 'Failed to create Supplier' }, 500)
    }
    let lastRowid = result.lastInsertRowid as number

    let sql2 = 'SELECT * FROM Supplier WHERE SupplierID = ?'
    let stmt2 = db.prepare<[number], Supplier>(sql2)
    let newSupplier = stmt2.get(lastRowid)

    return c.json({ message: 'Supplier created', data: newSupplier }, 201)
})
supplierRoutes.get('/', async (c) => {

  let sql = 'SELECT * FROM Supplier'
  let stmt = db.prepare<[],Supplier>(sql)
  let suppliers : Supplier[] = stmt.all()
    return c.json({ message: 'List of Supplier' , data : suppliers})
})
supplierRoutes.put('/:id', zValidator('json', updatesupplierSchema),async (c) => {
    const id = Number(c.req.param('id'))
    const body = await c.req.json<{
        Name: string
        Contact: string
        Address: string
        Email: string
        Phone: string
    }>()
    const sql = `
      UPDATE Supplier SET
        Name = COALESCE(@Name, Name),
        Contact = COALESCE(@Contact, Contact),
        Address = COALESCE(@Address, Address),
        Email = COALESCE(@Email, Email),
        Phone = COALESCE(@Phone, Phone)
      WHERE SupplierID = @id
    `
    const stmt = db.prepare(sql)
    const result = stmt.run({
      id,
        Name: body.Name ?? null,
        Contact: body.Contact ?? null,
        Address: body.Address ?? null,
        Email: body.Email ?? null,
        Phone: body.Phone ?? null,
    })
    if (result.changes === 0) {
      return c.json({ message: 'Supplier not found' }, 404)
    }
    const supplier = db.prepare('SELECT * FROM Supplier WHERE SupplierID = ?').get(id)
    return c.json(supplier)
  })
supplierRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const result = db.prepare('DELETE FROM Supplier WHERE SupplierID = ?').run(id)
    if (result.changes === 0) {
    return c.json({ message: 'Supplier not found' }, 404)
    }
    return c.json({ message: 'Supplier deleted' })
})

export default supplierRoutes;
