import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'middleware-api' })
})

app.listen(PORT, () => {
  console.log(`Middleware API rodando na porta ${PORT}`)
})