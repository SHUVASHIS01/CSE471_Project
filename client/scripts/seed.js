import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL is not set; skipping seed.')
    return
  }
  const prisma = new PrismaClient()
  const dataPath = path.join(process.cwd(), 'api', 'data', 'jobs.json')
  const raw = fs.readFileSync(dataPath, 'utf-8')
  const jobs = JSON.parse(raw)
  await prisma.job.deleteMany({})
  await prisma.job.createMany({ data: jobs })
  console.log(`Seeded ${jobs.length} jobs`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
