import mongodb from 'mongodb';

import Hotel, { isHotel } from '../models/Hotel';
import { DEFAULT_PAGE, API_VERSION, DEFAULT_LIMIT } from '../configs/server';

const { ObjectID } = mongodb;

export const migrateHotel = async(req, res) => {
  try{
    await Hotel.create(req.body);
    res.json({message: 'success'})
  }catch(err){
    res.status(500).json({message : 'error'})
  }
}

export const createHotel = async(req, res) => {
  const data = req.body;

  if(!isHotel(data)) return res.status(400).json({
    apiVersion: API_VERSION,
    error: {
      code: 400,
      message: 'Invalid body request!',
    }
  });

  try{
    const newHotel = await Hotel.create(data);

    return res.json({
      apiVersion: API_VERSION,
      data : newHotel,
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