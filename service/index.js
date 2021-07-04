import fs from 'fs';
import axios from 'axios';
import moment from 'moment';
import puppeteer from 'puppeteer';
import translate from 'translate';
import _ from 'lodash';
import Hotel from '../models/Hotel';
import { TRANSLATE_ENGINE } from '../configs/server';

export const scrapAgoda = async (url, maxReviewCount = 5) => {
  const pageRes = await axios.get(url);

  // get hotel id
  const hotel_id = pageRes.data
    .match(/hotel_id=(\d*)&/g)[0]
    .match(/\d/g)
    .join('')
  
  let hotelData = {}

  // get general data
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector('[data-selenium="hotel-header-name"]');

    let element = await page.$('[data-selenium="hotel-header-name"]');
    hotelData.name = await page.evaluate(el => el.textContent, element);

    await page.waitForSelector('[data-selenium="hotel-address-map"]');
    element = await page.$('[data-selenium="hotel-address-map"]');
    hotelData.address = await page.evaluate(el => el.textContent, element);

    hotelData.handleCovid = false;

    hotelData.city = _.capitalize(
      new URL(url).pathname
        .split('/')
        .pop()
        .replace('-id.html', '')
    );

    // agoda only supports hotel
    hotelData.category = 'hotel'

    hotelData.source = 'agoda';

    await page.waitForSelector('.SquareImage');
    hotelData.photos = await page.$$eval('.SquareImage',
      imgs => imgs.map(img => img.getAttribute('src'))
    );

    hotelData.photos = hotelData.photos.map(img => 'https:' + img);

    await page.goto(`${url}?checkIn=${moment().format('YYYY-MM-DD')}&checkOut=${moment().add(1, 'd').format('YYYY-MM-DD')}`)

    // check in date
    await page.waitForSelector(`[aria-label="${moment().format('ddd MMM DD YYYY')}"]`);
    await page.click(`[aria-label="${moment().format('ddd MMM DD YYYY')}"]`)

    // check out date
    await page.waitForSelector(`[aria-label="${moment().add(1, 'd').format('ddd MMM DD YYYY')}"]`);
    await page.click(`[aria-label="${moment().add(1, 'd').format('ddd MMM DD YYYY')}"]`)

    await page.click('[data-selenium="searchButton"]');

    await page.waitForSelector('[data-ppapi="room-price"]');
    element = await page.$('[data-ppapi="room-price"]');
    const ota = {
      price: await page.evaluate(el => Number(el.textContent.replace(/\D/g, '')), element),
      provider: 'agoda',
      link: url
    }

    hotelData.ota = [ota];

    await page.waitForSelector('[data-selenium="hotel-header-review-score"]');
    element = await page.$('[data-selenium="hotel-header-review-score"]');
    hotelData.averageRating = await page.evaluate(el => el.textContent, element);
    hotelData.averageRating = parseFloat(hotelData.averageRating) / 2;

    await browser.close();
  } catch (err) {
    console.log(err)
  }

  // scrap agoda reviews
  const reviews = []
  let i = 0;

  const { data } = await axios.post('https://www.agoda.com/api/cronos/property/review/HotelReviews', {
    "hotelId": Number(hotel_id),
    "demographicId": 0,
    "pageNo": 1,
    "pageSize": 20,
    "sorting": 7,
    "isReviewPage": true,
    "isCrawlablePage": true,
    "paginationSize": 5
  })

  // console.log(data)

  // hotelData.averageRating = data.combinedReview.score.score / 2;

  for (const r of data.commentList.comments) {
    // kata dalam review harus diatas 10 dan belum mencapai max review
    if (r.reviewComments.split(' ').length > 10 && i < maxReviewCount) {
      const review = {
        comment: r.reviewComments,
        name: r.reviewerInfo.displayMemberName,
        source: 'agoda',
        reviewDate: new Date(r.formattedReviewDate),
      }
  
      reviews.push(review);
      i++;
    }
  }

  hotelData.reviews = reviews;

  return hotelData;
}

export const scrapTiket = async (url, maxReviewCount = 5) => {
  const parsedUrl = new URL(url);
  const hotel_id = parsedUrl.pathname.split('/').pop();

  let hotelData = {}

  // get general data
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector('.property-name');

    let element = await page.$('.property-name');
    hotelData.name = await page.evaluate(el => el.textContent, element);

    await page.waitForSelector('.location-address .line-clamp-2');
    element = await page.$('.location-address .line-clamp-2');
    hotelData.address = await page.evaluate(el => el.textContent, element);

    try {
      await page.waitForSelector('.tiket-info-slider-wrapper', { timeout: 2000 });
      element = await page.$('.tiket-info-slider-wrapper');
      if (element) hotelData.handleCovid = true;
    } catch (error) {
      hotelData.handleCovid = false;
    }

    await page.waitForSelector('.location');
    element = await page.$('.location');
    hotelData.city = await page.evaluate(el => el.textContent.split(',').pop().trim(), element);

    await page.waitForSelector('.property-type');
    element = await page.$('.property-type');
    hotelData.category = await page.evaluate(el => el.textContent.toLowerCase(), element);

    hotelData.source = 'tiket';

    await page.waitForSelector('.photo img');
    hotelData.photos = await page.$$eval('.photo img',
      imgs => imgs.map(img => img.getAttribute('src'))
    );

    hotelData.photos = hotelData.photos.filter(img => img.startsWith('https://'));

    await page.waitForSelector('.score');
    element = await page.$('.score');
    hotelData.averageRating = await page.evaluate(el => Number(el.textContent), element);
  
    await page.waitForSelector('.price-info__price');
    element = await page.$('.price-info__price');
    const ota = {
      price: await page.evaluate(el => Number(el.textContent.replace(/\D/g, '')), element),
      provider: 'tiket',
      link: url
    }

    hotelData.ota = [ota];

    await browser.close();
  } catch (err) {
    console.log(err)
  }
  
  // scrap tiket reviews
  const reviews = []
  let i = 0;

  const { data } = await axios.post('https://gql.tiket.com/v1/hotel/graphql',
    [{
      "operationName": "getInternalReview",
      "variables": {
        "hotelPublicId": hotel_id,
        "page": 0,
        "size": 20,
        "reviewSubmitColumn": "HELPFULNESS",
        "sortDirection": "DESC"
      },
      "query": "query getInternalReview($hotelPublicId: String!, $page: Int!, $size: Int, $reviewSubmitColumn: String, $sortDirection: String, $userImageExists: Boolean, $type_of_traveler: String, $purpose_of_trip: String) {\n  getInternalReview(hotelPublicId: $hotelPublicId, page: $page, size: $size, reviewSubmitColumn: $reviewSubmitColumn, sortDirection: $sortDirection, userImageExist: $userImageExists, type_of_traveler: $type_of_traveler, purpose_of_trip: $purpose_of_trip) {\n    code\n    message\n    errors\n    data {\n      area\n      city\n      region\n      country\n      userReviews {\n        totalPages\n        totalElements\n        last\n        first\n        numberOfElements\n        size\n        number\n        empty\n        content {\n          submitId\n          startJourney\n          endJourney\n          ratingSummary\n          customerName\n          fake\n          totalLike\n          comments {\n            questionCode\n            questionTitle\n            value\n          }\n          userImages {\n            key\n            value\n          }\n          userReviewAnswers {\n            questionType\n            questionCode\n            questionTitle\n            answerCode\n            answerString\n            answerInteger\n          }\n          reported\n          totalItems\n          likedByMe\n          reviewDate\n        }\n      }\n      summaryReview {\n        totalReview\n        ratingSummary\n        summaryReviewAnswers {\n          questionType\n          questionCode\n          questionTitle\n          answerString\n          answerCode\n          avgRating\n          total\n        }\n        impression\n      }\n    }\n  }\n}\n"
    }]
  )

  if (data[0].data.getInternalReview) {
    for (const r of data[0].data.getInternalReview.data.userReviews.content) {
      const reviewContent = r.comments.find(val => val.questionCode === 'comment').value;
      // kata dalam review harus diatas 10 dan belum mencapai max review
      if (reviewContent.split(' ').length > 10 && i < maxReviewCount) {
        const review = {
          comment: reviewContent,
          name: r.customerName,
          source: 'tiket',
          reviewDate: new Date(Number(r.reviewDate)),
        }
  
        reviews.push(review);
        i++;
      }
    }
  }

  hotelData.reviews = reviews;

  return hotelData;
}

export const generatePrompt = async (hotel_name, reviews) => {
  if (reviews.length === 0) {
    return '';
  }

  let result = `These are the reviews for ${hotel_name}:\n`;
  let i = 1;

  for (const review of reviews) {
    result += `\n${i}.${review.name}'s review:\n`;

    // jika dari tiket.com maka bahasa indo
    if (review.source === 'tiket') {
      result += await translate(review.comment, {
        engine: TRANSLATE_ENGINE,
        from: 'id',
        to: 'en',
        key: process.env.TRANSLATE_KEY,
      }) + '\n';
    } else {
      result += `${review.comment}\n`
    }

    i += 1;
  }

  result += `\nI summarized these reviews for my customers:`
  return result;
}

export const formatReviewSummary = async (text, source) => {
  if (text === '') {
    return []
  }

  const result = text.split('\n').filter(t => t).map(t => t.replace(/- /g, ''));
  if (source === 'agoda') return result;

  const translatedResult = [];
  for (let t of result) {
    translatedResult.push(
      await translate(t, {
        engine: TRANSLATE_ENGINE,
        from: 'en',
        to: 'id',
        key: process.env.TRANSLATE_KEY,
      })
    )
  }
  return translatedResult
}

export const gpt3 = async (prompt, engine = 'davinci') => {
  if (prompt === '') {
    return '';
  }

  const INITIAL_PROMPT = fs.readFileSync('./configs/initialPrompt.txt', 'utf-8');

  const res = await axios.post(`https://api.openai.com/v1/engines/${engine}/completions`, {
    prompt: INITIAL_PROMPT + prompt,
    max_tokens: 150,
    temperature: 0.3,
    top_p: 1,
    n: 1,
    frequency_penalty: 1,
    stream: false,
    stop: '###',
  }, {
    headers: {
      Authorization: `Bearer ${process.env.GPT3_KEY}`
    }
  })

  return res.data.choices[0].text;
}

export const uploadSummary = async (filename, summary) => {
  return new Promise((resolve, reject) => {
    if (summary.length === 0) {
      return false;
    }

    let result = '';
    for (const s of summary) {
      result += `{ "text": "${s}", "metadata": "" }\n`
    }
    fs.writeFileSync(`./temp/${filename}`, result);

    const spawn = require("child_process").spawn;
    const pythonProcess = spawn('python', ["./service/upload.py", filename, process.env.GPT3_KEY]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    pythonProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    setTimeout(async () => {
      try {
        const { data } = await axios.get('https://api.openai.com/v1/files', {
          headers: {
            Authorization: `Bearer ${process.env.GPT3_KEY}`
          }
        })
    
        fs.unlinkSync(`./temp/${filename}`)
        
        await Hotel.findByIdAndUpdate(filename.replace('.jsonl', ''), {
          $set: {
            summaryFileId: data.data.find(d => d.filename === filename).id,
          }
        })

        resolve(data.data.find(d => d.filename === filename).id)
      } catch (err) {
        console.log(err);
        reject()
      }
    }, 3000)
  })
}

export const recommendation = async (query, engine = 'babbage') => {
  const allHotels = await Hotel.find({})

  // const allHotelSummaryFileId = allHotels.map(hotel => hotel.summaryFileId).filter(id => id)
  const allReviewSummaries = []
  for (const hotel of allHotels) {
    if (hotel.source === 'tiket') {
      const translatedResult = [];

      for (let t of hotel.reviewSummary) {
        translatedResult.push(
          await translate(t, {
            engine: TRANSLATE_ENGINE,
            from: 'id',
            to: 'en',
            key: process.env.TRANSLATE_KEY,
          })
        )
      }

      allReviewSummaries.push(translatedResult.map(s => '- ' + s).join('\n'));
    } else {
      allReviewSummaries.push(hotel.reviewSummary.map(s => '- ' + s).join('\n'));
    }
  }

  try {
    const { data } = await axios.post(`https://api.openai.com/v1/engines/${engine}/search`, {
      documents: allReviewSummaries,
      query,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GPT3_KEY}`
      }
    })
    
    const rank = data.data.sort((a, b) => b.score - a.score).filter(a => a.score >= 140)

    const resultHotels = []
    for (const r of rank) {
      resultHotels.push(allHotels[r.document])
    }
    
    return resultHotels
  } catch (err) {
    console.log(err)
  }
}