import { AGODA_MAX_REVIEW, API_VERSION, TIKET_MAX_REVIEW } from "../configs/server"
import { generatePrompt, scrapAgoda, scrapTiket } from "../service"

export const devHandler = async (req, res) => {
  // const hotel = await scrapAgoda(req.query.link, AGODA_MAX_REVIEW)
  const hotel = await scrapTiket(req.query.link, TIKET_MAX_REVIEW)

  generatePrompt(hotel.name, hotel.reviews);
  // scrapTiket('https://www.tiket.com/hotel/indonesia/sheraton-bandung-hotel-and-tower-108001534490501186', TIKET_MAX_REVIEW)

  res.json({
    apiVersion: API_VERSION,
    data: hotel
  })
}