import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

// Map Google place types → our simplified types
function resolveType(types: string[]): string {
  if (types.includes('country')) return 'country'
  if (types.includes('administrative_area_level_1')) return 'region'
  if (types.includes('administrative_area_level_2')) return 'district'
  if (types.includes('locality') || types.includes('postal_town')) return 'place'
  if (types.includes('sublocality') || types.includes('neighborhood')) return 'locality'
  if (types.includes('route') || types.includes('street_address')) return 'address'
  if (types.includes('airport')) return 'airport'
  if (types.includes('natural_feature') || types.includes('point_of_interest')) return 'poi'
  if (types.includes('establishment')) return 'poi'
  return 'place'
}

export async function GET(req: NextRequest) {
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 })
  }

  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const limit = parseInt(searchParams.get('limit') ?? '8', 10)

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const body: Record<string, unknown> = {
      textQuery: q,
      languageCode: 'en',
      pageSize: Math.min(limit, 20),
    }

    // Bias results toward current map view if coordinates provided
    if (lat && lon) {
      body.locationBias = {
        circle: {
          center: { latitude: parseFloat(lat), longitude: parseFloat(lon) },
          radius: 50000, // 50km bias radius
        },
      }
    }

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.viewport',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[geocode] Google Places error:', err)
      return NextResponse.json({ results: [] })
    }

    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const places = (data.places ?? []) as any[]

    const results = places.map(p => {
      const types: string[] = p.types ?? []
      const type = resolveType(types)

      // Build viewport bbox if available [west, south, east, north]
      let bbox: [number, number, number, number] | undefined
      if (p.viewport?.low && p.viewport?.high) {
        bbox = [
          p.viewport.low.longitude,
          p.viewport.low.latitude,
          p.viewport.high.longitude,
          p.viewport.high.latitude,
        ]
      }

      return {
        id: p.id,
        name: p.displayName?.text ?? q,
        fullName: p.formattedAddress ?? p.displayName?.text ?? '',
        type,
        latitude: p.location?.latitude ?? 0,
        longitude: p.location?.longitude ?? 0,
        bbox,
      }
    })

    return NextResponse.json({ results })
  } catch (err) {
    console.error('[geocode] fetch error:', err)
    return NextResponse.json({ results: [] })
  }
}
