import Hotel, { isHotel } from '../models/Hotel';
import { API_VERSION } from '../configs/server';

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