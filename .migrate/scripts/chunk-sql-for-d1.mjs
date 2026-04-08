import fs from 'node:fs'
import path from 'node:path'

const [, , inFile, outFile] = process.argv
if (!inFile || !outFile) {
  console.error('Usage: node chunk-sql-for-d1.mjs <input.sql> <output.sql>')
  process.exit(1)
}

const inputPath = path.resolve(inFile)
const outputPath = path.resolve(outFile)
const sql = fs.readFileSync(inputPath, 'utf8')

const chunkByTable = new Map([
  ['payload_folders', 20],
  ['payload_folders_folder_type', 20],
  ['media', 12],
])

const splitTopLevelTuples = (valuesBlock) => {
  const tuples = []
  let start = -1
  let depth = 0
  let inString = false

  for (let i = 0; i < valuesBlock.length; i += 1) {
    const ch = valuesBlock[i]

    if (inString) {
      if (ch === "'") {
        if (valuesBlock[i + 1] === "'") {
          i += 1
        } else {
          inString = false
        }
      }
      continue
    }

    if (ch === "'") {
      inString = true
      continue
    }

    if (ch === '(') {
      if (depth === 0) start = i
      depth += 1
      continue
    }

    if (ch === ')') {
      depth -= 1
      if (depth === 0 && start !== -1) {
        tuples.push(valuesBlock.slice(start, i + 1))
        start = -1
      }
    }
  }

  return tuples
}

const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

let outSQL = sql

for (const [table, size] of chunkByTable.entries()) {
  const re = new RegExp(
    `INSERT INTO ${table} \\([\\s\\S]*?\\)\\nVALUES\\n([\\s\\S]*?)\\nON CONFLICT\\(id\\) DO UPDATE SET\\n([\\s\\S]*?);`,
    'g',
  )

  outSQL = outSQL.replace(re, (full, valuesBlock, updateBlock) => {
    const prefix = full.slice(0, full.indexOf('\nVALUES\n'))
    const tuples = splitTopLevelTuples(valuesBlock)
    if (tuples.length <= size) return full

    const updates = updateBlock.trimEnd()
    const batched = chunk(tuples, size)

    return batched
      .map((batch) => {
        return [
          prefix,
          'VALUES',
          batch.map((t) => `  ${t}`).join(',\n'),
          'ON CONFLICT(id) DO UPDATE SET',
          updates,
          ';',
        ].join('\n')
      })
      .join('\n\n')
  })
}

fs.writeFileSync(outputPath, outSQL, 'utf8')

console.log(`Wrote chunked SQL: ${outputPath}`)
