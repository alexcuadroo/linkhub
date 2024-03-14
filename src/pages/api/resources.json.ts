import { getResources, getTittleFromUrl } from "@utils/utils"
import type { APIRoute } from "astro"
import cheerio from "cheerio"

export const GET: APIRoute = async () => {
  // get resources

  const CSV_URL =
    "https://raw.githubusercontent.com/doneber/linkhub/main/public/resources.csv"

  const resources = await getResources(CSV_URL)

  const getMetadata = async (url: string) => {
		try {
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`Error en la solicitud HTTP: ${response.status}`)
			}
			const html = await response.text()
			const $ = cheerio.load(html)
			const imageUrl = $("meta[property=\"og:image\"]").attr("content") ?? undefined
			const fullTitle = $("title").text() || $("meta[property=\"og:title\"]").attr("content") || getTittleFromUrl(url)
			const titleParts = fullTitle.split(/ – | - | \| | — |: | : | · /) // Usa una expresión regular para cubrir ambos separadores
			const title = titleParts[0] ?? "" // Toma solo la primera parte, asumiendo que es el "verdadero" título

			let description = $("meta[property=\"og:description\"]").attr("content")
			if (!description) {
				description = $("meta[name=\"description\"]").attr("content") ?? ""
			}

			return { title, description, imageUrl }
		} catch (error) {
			return { title: getTittleFromUrl(url) }
		}
  }

  const fullResourcesData = await Promise.all(
    resources.map(async (resource) => {
      const metadata = await getMetadata(resource.url)
      return {
        ...resource,
        ...metadata,
      }
    })
  )

  return new Response(
    JSON.stringify({
      resources: fullResourcesData,
    })
  )
}
