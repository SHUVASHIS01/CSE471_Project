const { PrismaClient } = require('@prisma/client')

let prisma
function getPrisma() {
  if (!prisma) prisma = new PrismaClient()
  return prisma
}

function buildWhere({ title, location, keywords, q }) {
  const where = {}
  if (title) where.title = { contains: title, mode: 'insensitive' }
  if (location) where.location = { contains: location, mode: 'insensitive' }
  const terms = (keywords || '').split(',').map(s => s.trim()).filter(Boolean)
  if (terms.length) where.keywords = { hasSome: terms }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { company: { contains: q, mode: 'insensitive' } },
      { location: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ]
  }
  return where
}

async function handler(req, res) {
  const { title, location, keywords, q } = req.query
  const page = Math.max(parseInt(req.query.page || '1', 10), 1)
  const limit = Math.min(parseInt(req.query.limit || '10', 10), 50)
  const skip = (page - 1) * limit

  try {
    if (process.env.DATABASE_URL) {
      const where = buildWhere({ title, location, keywords, q })
      const prismaClient = getPrisma()
      const [items, total] = await Promise.all([
        prismaClient.job.findMany({ where, take: limit, skip, orderBy: { createdAt: 'desc' } }),
        prismaClient.job.count({ where })
      ])
      return res.status(200).json({ items, total, page, limit })
    }
  } catch (err) {
    console.error('Prisma query failed', err)
  }

  const data = require('./data/jobs.json')
  let filtered = data
  const qLower = (q || '').toLowerCase()
  const titleLower = (title || '').toLowerCase()
  const locationLower = (location || '').toLowerCase()
  const terms = (keywords || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)

  if (qLower) {
    filtered = filtered.filter(j =>
      j.title.toLowerCase().includes(qLower) ||
      j.company.toLowerCase().includes(qLower) ||
      j.location.toLowerCase().includes(qLower) ||
      j.description.toLowerCase().includes(qLower)
    )
  }
  if (titleLower) filtered = filtered.filter(j => j.title.toLowerCase().includes(titleLower))
  if (locationLower) filtered = filtered.filter(j => j.location.toLowerCase().includes(locationLower))
  if (terms.length) filtered = filtered.filter(j => terms.some(t => j.keywords.map(k => k.toLowerCase()).includes(t)))

  filtered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const total = filtered.length
  const items = filtered.slice(skip, skip + limit)
  return res.status(200).json({ items, total, page, limit })
}

module.exports = handler

