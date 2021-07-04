import { AGODA_MAX_REVIEW, API_VERSION, TIKET_MAX_REVIEW } from "../configs/server"
import { generatePrompt, scrapAgoda, scrapTiket } from "../service"

export const devHandler = async (req, res) => {
  const hotel = await scrapAgoda('https://www.agoda.com/century-park-hotel/hotel/jakarta-id.html', AGODA_MAX_REVIEW)

  generatePrompt(hotel.name, hotel.reviews);
  // scrapTiket('https://www.tiket.com/hotel/indonesia/sheraton-bandung-hotel-and-tower-108001534490501186', TIKET_MAX_REVIEW)

  res.json({
    apiVersion: API_VERSION,
    data: 'OK'
  })
}