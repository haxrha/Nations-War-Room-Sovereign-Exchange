import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import { useEffect, useMemo } from 'react'
import { useGame } from '../../context/GameContext'
import { formatMoney, getCountry, botStrategyLabel, idStr } from '../../lib/utils'
import { Panel } from '../ui/Panel'
import { tokens } from '../../lib/design-system'

function MapResizer() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export function WorldMap() {
  const { countries, offers, playerCountryId, commodities } = useGame()

  const offerArcs = useMemo(() => {
    return offers.slice(0, 12).map((offer) => {
      const seller = getCountry(offer.sellerId, countries)
      if (!seller) return null
      const commodity = commodities.find((c) => c.id === offer.commodityId)
      const hubLat = seller.lat + (commodity ? (Number(offer.commodityId) % 5) - 2 : 0)
      const hubLng = seller.lng + (commodity ? (Number(offer.commodityId) % 3) - 1 : 0) * 8
      return { offer, seller, hubLat, hubLng, commodity }
    }).filter(Boolean)
  }, [offers, countries, commodities])

  const onlineCount = countries.filter((c) => c.online).length

  return (
    <Panel
      title="World Map"
      subtitle={`${countries.length} nations · ${onlineCount} online · ${offers.length} open offers`}
      label="Geography"
      spotlight
      className="min-h-[320px]"
    >
      <div className="relative min-h-[280px] flex-1 lg:min-h-0">
        <MapContainer
          center={[20, 10]}
          zoom={2}
          minZoom={2}
          maxZoom={6}
          className="h-full w-full"
          zoomControl={false}
        >
          <MapResizer />
          <TileLayer
            attribution='&copy; OSM'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {countries.map((country) => {
            const isPlayer = playerCountryId != null && country.id === playerCountryId
            const hasOffers = offers.some((o) => o.sellerId === country.id)
            const fill = isPlayer ? tokens.color.accent : hasOffers ? tokens.color.accentBright : '#3f3f46'
            return (
              <CircleMarker
                key={idStr(country.id)}
                center={[country.lat, country.lng]}
                radius={isPlayer ? 14 : hasOffers ? 11 : 8}
                pathOptions={{
                  color: isPlayer ? tokens.color.accent : 'rgba(255,255,255,0.3)',
                  fillColor: fill,
                  fillOpacity: isPlayer ? 1 : 0.75,
                  weight: isPlayer ? 2 : 1,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div className="text-xs">
                    <div className="font-semibold">
                      {country.flag} {country.name}
                    </div>
                    <div className="text-[#8A8F98]">{country.region}</div>
                    <div className="font-medium text-[#5E6AD2]">
                      GDP {formatMoney(country.gdpScore, true)}
                    </div>
                    {country.isBot && (
                      <div className="text-[10px] text-[#8A8F98]">
                        {botStrategyLabel(country.botStrategy)}
                      </div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}
          {offerArcs.map((item) =>
            item ? (
              <Polyline
                key={idStr(item.offer.id)}
                positions={[
                  [item.seller.lat, item.seller.lng],
                  [item.hubLat, item.hubLng],
                ]}
                pathOptions={{
                  color: tokens.color.accent,
                  weight: 1.5,
                  opacity: 0.35,
                  dashArray: '4 8',
                }}
              />
            ) : null,
          )}
        </MapContainer>
      </div>
    </Panel>
  )
}
