import mongoose from 'mongoose';
import validator from 'validator';

const { isURL } = validator;

const validateHotelPhotos = (photos) => {
  try{
    if(photos.length < 1 || photos.length > 5) return false;

    for(const photo of photos) {
      if(!isURL(photo)) return false;
    }

    return true;
  }catch {
    return false;
  }
}

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A hotel must have a name"],
    trim: true,
  },
  address: {
    type: String,
    required: [true, "A hotel must have a address"],
    trim: true,
  },
  handleCovid: {
    type: Boolean,
    default: false,
  },
  city: {
    type: String,
    required: [true, "A hotel must have a city"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "A hotel must have a category"],
    trim: true,
  },
  source: {
    type: String,
    required: [true, "A hotel must have a source"],
    trim: true,
  },
  photos : {
    type: [String],
    validate: [validateHotelPhotos, 'Please input valid photos'],
  },
  averageRating : {
    type: Number,
    min: [0, "Ratings average must be greater or equal to 0"],
    max: [5, "Ratings average must be less than or equal to 5 "],
  },
  ota: [{ price: Number, provider: String, link: String }],
  reviews: [{
    comment: {type: String, required: [true, "comment can't be empty"]},
    name: {type: String, required: [true, "name can't be empty"]},
    source: {type: String, required: [true, "source can't be empty"]},
    reviewDate: Date,
  }],
  reviewSummary: [String],
  summaryFileId: String,
  createdAt: {type: Date, default: Date.now()},
});

export const isHotel = (input) => {
  try {
    if(typeof input.name !== 'string') return false;
    if(typeof input.city !== 'string') return false;
    if(typeof input.category !== 'string') return false;
    if(typeof input.source !== 'string') return false;
    if(typeof input.city !== 'string') return false;

    if(typeof input.photos !== 'object') return false;
    if(typeof input.ota !== 'object') return false;
    if(typeof input.reviewSummary !== 'object') return false;
    if(typeof input.reviews !== 'object') return false;

    if(typeof input.averageRating !== 'number') return false;

    return true;
  }catch {
    return false;
  }
}

export default mongoose.model('Hotel', HotelSchema);