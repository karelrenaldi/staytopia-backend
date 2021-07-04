import { AGODA_MAX_REVIEW, API_VERSION, TIKET_MAX_REVIEW } from "../configs/server"
import { formatSummary, generatePrompt, gpt3, scrapAgoda, scrapTiket } from "../service"

export const devHandler = async (req, res) => {
  // const hotel = await scrapAgoda(req.query.link, AGODA_MAX_REVIEW)
  const hotel = await scrapTiket(req.query.link, TIKET_MAX_REVIEW)

  // const prompt = await generatePrompt(hotel.name, hotel.reviews);
  // const summary = await gpt3(prompt, 'curie');

  res.json({
    apiVersion: API_VERSION,
    data: hotel
  })
}