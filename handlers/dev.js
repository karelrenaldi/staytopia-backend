import { AGODA_MAX_REVIEW, API_VERSION, TIKET_MAX_REVIEW } from "../configs/server"
import { formatSummary, generatePrompt, gpt3, scrapAgoda, scrapTiket } from "../service"

export const devHandler = async (req, res) => {
  const hotel = await scrapTiket('https://www.tiket.com/hotel/indonesia/raffles-jakarta-108001534517482611', TIKET_MAX_REVIEW)
  // let hotel = await scrapAgoda('https://www.agoda.com/century-park-hotel/hotel/jakarta-id.html', AGODA_MAX_REVIEW)
  console.log(hotel)

  // const prompt = await generatePrompt(hotel.name, hotel.reviews);
  // const summary = await gpt3(prompt, 'curie');

  res.json({
    apiVersion: API_VERSION,
    hotel: hotel,
    // data: await formatSummary(summary)
  })
}