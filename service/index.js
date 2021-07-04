import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';

export const scrapAgoda = async (url, maxReviewCount = 5) => {
  const pageRes = await axios.get(url);

  // get hotel id
  const hotel_id = pageRes.data
    .match(/hotel_id=(\d*)&/g)[0]
    .match(/\d/g)
    .join('')
  
  let hotelData = {}
  
  // scrap agoda reviews
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

  hotelData.name = data.hotelName;
  hotelData.address = 'unscrapable';
  hotelData.handleCovid = false;
  hotelData.city = 'unscrapable';
  hotelData.category = 'unscrapable';
  hotelData.source = 'agoda';
  hotelData.photos = 'unscrapable';
  hotelData.averageRating = data.combinedReview.score.score / 2;

  hotelData.ota = [];

  const reviews = []
  let i = 0;

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

  console.log(hotelData)

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

    await page.waitForSelector('.tiket-info-slider-wrapper');
    element = await page.$('.tiket-info-slider-wrapper');
    hotelData.handleCovid = element ? true : false;

    await page.waitForSelector('.location');
    element = await page.$('.location');
    hotelData.city = await page.evaluate(el => el.textContent.split(',').pop().trim(), element);

    await page.waitForSelector('.property-type');
    element = await page.$('.property-type');
    hotelData.category = await page.evaluate(el => el.textContent, element);

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

  hotelData.reviews = reviews;

  return hotelData;
}

export const gpt3 = async (prompt) => {

}