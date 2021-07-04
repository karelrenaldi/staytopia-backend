import { AGODA_MAX_REVIEW, API_VERSION, TIKET_MAX_REVIEW } from "../configs/server"
import { scrapAgoda, scrapTiket } from "../service"

export const devHandler = async (req, res) => {
  // scrapAgoda('https://www.agoda.com/century-park-hotel/hotel/jakarta-id.html', AGODA_MAX_REVIEW)
  scrapTiket('https://www.tiket.com/hotel/indonesia/sheraton-bandung-hotel-and-tower-108001534490501186', TIKET_MAX_REVIEW)

  res.json({
    apiVersion: API_VERSION,
    data: 'OK'
  })
}