import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z]/g, '')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: 'File must contain at least a header row and one data row' }, { status: 400 })
    }

    const headers = parseCSVLine(lines[0])
    const normalizedHeaders = headers.map(normalizeHeader)

    // Map common header variations
    const findColumn = (...names: string[]): number => {
      const normalized = names.map(normalizeHeader)
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (normalized.includes(normalizedHeaders[i])) return i
      }
      return -1
    }

    const colStudentName = findColumn('studentname', 'student', 'name', 'childname')
    const colParentName = findColumn('parentname', 'parent', 'guardianname', 'fathername', 'mothername')
    const colPhone = findColumn('phone', 'mobile', 'contact', 'phonenumber', 'mobilenumber')
    const colAltPhone = findColumn('altphone', 'alternatenumber', 'alternatemobile', 'phone2')
    const colEmail = findColumn('email', 'emailid', 'emailaddress')
    const colGrade = findColumn('grade', 'class', 'gradeapplied', 'classapplied', 'applyingfor')
    const colCampus = findColumn('campus')
    const colSource = findColumn('source', 'leadsource')
    const colStatus = findColumn('status', 'leadstatus')
    const colPriority = findColumn('priority')
    const colPreviousSchool = findColumn('previousschool', 'lastschool')
    const colDOB = findColumn('dob', 'dateofbirth', 'birthdate')
    const colAddress = findColumn('address', 'location')
    const colNotes = findColumn('notes', 'remarks', 'comments')

    if (colStudentName === -1 || colPhone === -1) {
      return NextResponse.json({
        error: 'CSV must contain at least "Student Name" and "Phone" columns',
      }, { status: 400 })
    }

    const results = { success: 0, failed: 0, errors: [] as string[] }
    const existingCount = await db.lead.count()

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i])

        const studentName = values[colStudentName]
        const phone = values[colPhone]

        if (!studentName || !phone) {
          results.failed++
          results.errors.push(`Row ${i + 1}: Missing required fields`)
          continue
        }

        const leadId = `SPIS${String(existingCount + i).padStart(5, '0')}`

        await db.lead.create({
          data: {
            leadId,
            studentName,
            parentName: colParentName >= 0 ? values[colParentName] || '' : '',
            phone,
            altPhone: colAltPhone >= 0 ? values[colAltPhone] || null : null,
            email: colEmail >= 0 ? values[colEmail] || null : null,
            gradeApplied: colGrade >= 0 ? values[colGrade] || 'Nursery' : 'Nursery',
            campus: colCampus >= 0 ? values[colCampus] || 'City Campus' : 'City Campus',
            source: colSource >= 0 ? values[colSource] || 'Website' : 'Website',
            status: colStatus >= 0 ? values[colStatus] || 'NEW' : 'NEW',
            priority: colPriority >= 0 ? values[colPriority] || 'MEDIUM' : 'MEDIUM',
            previousSchool: colPreviousSchool >= 0 ? values[colPreviousSchool] || null : null,
            dateOfBirth: colDOB >= 0 ? values[colDOB] || null : null,
            address: colAddress >= 0 ? values[colAddress] || null : null,
            notes: colNotes >= 0 ? values[colNotes] || null : null,
          },
        })

        results.success++
      } catch (err) {
        results.failed++
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      total: lines.length - 1,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 })
  }
}
