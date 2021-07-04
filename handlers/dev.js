import { AGODA_MAX_REVIEW, API_VERSION, TIKET_MAX_REVIEW } from "../configs/server"
import { formatSummary, generatePrompt, gpt3, recommendation, scrapAgoda, scrapTiket, uploadSummary } from "../service"
import axios from 'axios'
import Hotel from '../models/Hotel';

export const devHandler = async (req, res) => {  
  res.json({
    apiVersion: API_VERSION,
    data: 'ok'
  })
}