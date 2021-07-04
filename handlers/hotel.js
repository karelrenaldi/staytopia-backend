import mongodb from 'mongodb';

import Hotel, { isHotel } from '../models/Hotel';
import { DEFAULT_PAGE, API_VERSION, DEFAULT_LIMIT, TIKET_MAX_REVIEW, AGODA_MAX_REVIEW } from '../configs/server';
import { formatReviewSummary, generatePrompt, gpt3, scrapAgoda, scrapTiket } from '../service';

const { ObjectID } = mongodb;

const validateLink = (url) => {
  const parsedUrl = new URL(url);

  if (!parsedUrl.host.includes('agoda.com') && !parsedUrl.host.includes('tiket.com')) {
    throw new Error('invalid url');
  }

  const parsedPathname = parsedUrl.pathname.split('/').filter(p => p);

  if (parsedUrl.host.includes('agoda.com')
    && parsedPathname.length === 3
    && parsedPathname[1] === 'hotel'
    && parsedUrl.pathname.endsWith('.html')
  ) {
    return parsedUrl.origin + parsedUrl.pathname;
  }

  if (parsedUrl.host.includes('tiket.com')
    && parsedPathname.length === 3
    && parsedPathname[0] === 'hotel'
  ) {
    return parsedUrl.origin + parsedUrl.pathname;
  }

  throw new Error('invalid url');
}

export const migrateHotel = async(req, res) => {
  try{
    await Hotel.create(req.body);
    res.json({message: 'success'})
  }catch(err){
    res.status(500).json({message : 'error'})
  }
}

export const createHotel = async(req, res) => {
  const { url, source } = req.body;

  if (source !== 'agoda' && source !== 'tiket') {
    return res.status(400).json({
      apiVersion: API_VERSION,
      error: {
        code: 400,
        message: 'Invalid body request!',
      }
    })
  }

  let parsedUrl;

  try {
    parsedUrl = validateLink(url);

    if (!parsedUrl.includes(source)) {
      throw new Error('invalid url')
    }

  } catch (err) {
    return res.status(400).json({
      apiVersion: API_VERSION,
      error: {
        code: 400,
        message: `Invalid URL for ${source}!`,
      }
    })
  }

  try {
    let hotel;

    if (source === 'agoda') {
      hotel = await scrapAgoda(parsedUrl, AGODA_MAX_REVIEW)
    } else if (source === 'tiket') {
      hotel = await scrapTiket(parsedUrl, TIKET_MAX_REVIEW)
    }

    const prompt = await generatePrompt(hotel.name, hotel.reviews);
    const summary = await gpt3(prompt, 'curie');

    hotel.reviewSummary = await formatReviewSummary(summary, source);

    const hotelDocument = await Hotel.create(hotel)

    return res.json({
      apiVersion: API_VERSION,
      data: hotelDocument
    });
  }catch(err){
    console.log("Error when trying to create new hotel!");
    console.log(err);

    return res.status(500).json({
      apiVersion: API_VERSION,
      error: {
        code: 500,
        message: 'Internal server error when create new hotel!',
      }
    });
  }
}

export const retrieveHotel = async(req, res) => {
  const page = isNaN(parseInt(req.query.page, 10)) ? DEFAULT_PAGE : parseInt(req.query.page, 10);
  const limit = DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  try{
    const [pageItems, totalAllItems] = await Promise.all([
      Hotel.find().skip(skip).limit(limit),
      Hotel.countDocuments(),
    ]);

    return res.json({
      apiVersion: API_VERSION,
      data : {
        totalItems: totalAllItems,
        startIndex: page,
        itemsPerPage: pageItems.length,
        items: pageItems,
      }
    });
  }catch(err){
    console.log("Error when trying to retrieve hotels");
    console.log(err);

    return res.status(500).json({
      apiVersion: API_VERSION,
      error: {
        code: 500,
        message: 'Internal server error when retrieve hotels',
      }
    })
  }
}

export const retrieveSpesificHotel = async(req, res) => {
  const { hotelId } = req.params;

  if(!ObjectID.isValid(hotelId)) return res.status(400).json({
    apiVersion : API_VERSION,
    error : {
      code: 400,
      message: 'Invalid hotelId'
    }
  })

  try{
    const hotel = await Hotel.findById(hotelId);

    if(!hotel) return res.status(404).json({
      apiVersion: API_VERSION,
      error: {
        code: 404,
        message: 'Hotel with specified id not found!'
      }
    });

    return res.json({
      apiVersion: API_VERSION,
      data: hotel,
    });
  }catch{
    console.log("Error when trying to retrieve spesific hotel!");
    console.log(err);

    return res.status(500).json({
      apiVersion: API_VERSION,
      error: {
        code: 500,
        message: 'Internal server error when retrieve spesific hotel!',
      }
    });
  }
}