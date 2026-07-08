export function generateAvroSample(schemaJson: string): string {
  try {
    const schema = JSON.parse(schemaJson) as any
    return JSON.stringify(generateSampleFromSchema(schema), null, 2)
  } catch (error) {
    throw new Error('Invalid Avro schema JSON')
  }
}

function generateSampleFromSchema(schema: any): any {
  if (typeof schema === 'string') {
    return sampleAvroType(schema)
  }

  if (Array.isArray(schema)) {
    return schema.map((entry) => generateSampleFromSchema(entry))[0]
  }

  if (schema == null || typeof schema !== 'object') {
    return null
  }

  switch (schema.type) {
  case 'record':
    return schema.fields?.reduce((acc: Record<string, unknown>, field: any) => {
      acc[field.name] = generateSampleFromSchema(field.type)
      return acc
    }, {})
  case 'array':
    return [generateSampleFromSchema(schema.items)]
  case 'map':
    return { example: generateSampleFromSchema(schema.values) }
  case 'enum':
    return schema.symbols?.[0] ?? 'UNKNOWN'
  case 'fixed':
    return 'AAAA'
  case 'union':
    return generateSampleFromSchema(schema.types?.[0])
  default:
    return sampleAvroType(schema.type)
  }
}

function sampleAvroType(type: any): unknown {
  switch (type) {
  case 'null':
    return null
  case 'boolean':
    return true
  case 'int':
  case 'long':
    return 0
  case 'float':
  case 'double':
    return 0.0
  case 'bytes':
    return 'ZGF0YQ=='
  case 'string':
    return 'example'
  default:
    return null
  }
}
