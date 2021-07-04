import { AGODA_MAX_REVIEW, API_VERSION, TIKET_MAX_REVIEW } from "../configs/server"
import { formatSummary, generatePrompt, gpt3, scrapAgoda, scrapTiket } from "../service"

export const devHandler = async (req, res) => {
  let hotel = await scrapAgoda('https://www.agoda.com/century-park-hotel/hotel/jakarta-id.html', AGODA_MAX_REVIEW)
  // const hotel = await scrapTiket('https://www.tiket.com/hotel/indonesia/sheraton-bandung-hotel-and-tower-108001534490501186', TIKET_MAX_REVIEW)

  const prompt = await generatePrompt(hotel.name, hotel.reviews);
  const summary = await gpt3(prompt, 'davinci');

  res.json({
    apiVersion: API_VERSION,
    data: await formatSummary(summary)
  })
}