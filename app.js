const bodyParser = require('body-parser');
const request = require('request-promise');
const cors = require('cors');

const express = require('express');
const app = express();
app.use(cors());
app.use(bodyParser.json());

const createSample = ({keywords, description = ''}) => [
  `Keywords: ${keywords}`.trim(),
  `Description: ${description}`.trim(),
].join('\n\n');

const STOP_PHRASE = `###`;
const SAMPLE_SEPARATOR = `\n\n${STOP_PHRASE}\n\n`;

const trainingData = [
  createSample({
    keywords: '3-bedroom 2-bath. Condo in Bayview Heights, San Francisco. Beautiful views. Fireplace. Warm and bright. Recently renovated. Newly landscaped backyard with mini orchard. Garage. Near freeway and public transportation.',
    description: 'Opportunity! Stunning two level 3-bedroom 2-bath Bayview Heights condo. This perfectly located corner building captures the most beautiful views of San Francisco. Your heart will skip a beat when you enter this home and feel its warmth and brightness. The home has been recently renovated from top to bottom and is move in ready. The first floor of the home offers a formal entry that leads to a large flex room great as a family room, home gym or oversized home office. The upper level offers living room, kitchen/dinning, two bedrooms, full bath and a master suite. The ambiance of the fireplace with the San Francisco back drop makes the living/dining areas of the home magical and super inviting. You will love to hang out in the newly landscaped backyard complete with your own mini orchard. Home also offers garage and bonus storage area in the basement. Location is simply perfect for commuting and getting out of the city as its located near freeway entrance and public transportation. A must see!'
  }),
  createSample({
    keywords: '2 bedroom/2.5 bath. Mission Bay. Kitchen with a lot of storage, granite counters, high-end stainless-steel appliances. Built-in office area. Power room. In-unit washer/dryer. Spacious, private terrace. Lots of light. Custom hardwood floors, recessed lighting. Close to CalTrain, Ferry Building, Chase Center.',
    description: 'Welcome to 235 Berry. Rarely available, this exceptional 2 bedroom/2.5 bath home offers the ultimate in Mission Bay living. The terrace-level unit enjoys a large living area as you enter the unit with the primary suite on one side and second bedroom/bath on the other. The kitchen provides great storage, granite counters and high-end stainless-steel appliances.  There is a built-in office area, powder room and in-unit washer/dryer.  What separates this special unit from the others is its spacious, private terrace.  Light pours from the terrace into the living areas through floor to ceiling windows. Sold by the original owner, the unit is in pristine condition, enjoying significant upgrades including built-in bed and shelving, custom hardwood floors, recessed lighting and closet built-ins. The tranquility of Berry Street belies the fact that you are in the heart of one of San Francisco\'s most exciting neighborhoods, close to Oracle, Chase Center, CalTrain, the Ferry Building and more!'
  }),
  createSample({
    keywords: 'Unit 803, SOMA Grand. One bed, one path. Hardwood floors. New carpet in bedroom. Stainless steel appliances. A lot of countertop space. Big windows with sun from the south. In-unit laundry. On-site parking. Full-service luxury high-rise. Bi-monthly house cleaning. Close to Bart, Muni, Highway 101.',
    description: 'Welcome home to Unit 803 at the amenity rich SOMA Grand! This bright and spacious one bed, one bath, plus den condo spans ~755 sq ft. Gleaming hardwood floors span the living, kitchen and den area while plush new carpet beckons you to your cozy bedroom. The open concept kitchen comes complete with stainless steel appliances and offers a plethora of cabinet and countertop space - perfect for the cook and entertainer. Expansive windows, covering nearly the entire height and width of the living room allow for southern sun exposure, views of the city, and greenery below. In-unit laundry and on-site parking complete this home. SOMA Grand is a full-service luxury high-rise with 24-hour attended lobby, bi-monthly house cleaning, fitness center, spa/hot tub, BBQ grill area, fire pit, meeting/lounge areas, club room w/ full kitchen, and wellness studio. Enjoy easy commutes with close proximity and accessibility to BART, MUNI,  I-80, I-280 and Hwy 101.',
  }),
  createSample({
    keywords: '3 bedroom, 2.5 bathroom home. Surrounded by gardens. Views of Southern Hills. Lots of southern light. Private ground level. Lemon tree. Second floor has gas fireplace, open kitchen/dining area. Views of the Southern Hills, Balboa Park, Sunnyside Conservatory. CLose to Glen Park Village, BART, Safeway and Highway 101.',
    description: 'Welcome to an impressive, perfectly situated home in Glen Park! This three bedroom, two and a half bathroom home offers a private ground level with gardens that are surrounded by a beautiful mature tree-line. Inside the home you will find a newly remodeled kitchen, breakfast area, living room and dining room. The stylish kitchen features custom cabinetry with granite counter tops, tile flooring, and a gas fireplace. The main level also offers a bedroom, bathroom, laundry area and a mud room. The second floor of the home offers two more bedrooms and another full bathroom. The property is situated amongst mature trees and a lemon tree! Enjoy views of the southern hills, Balboa Park, and the Sunnyside Conservatory. Just minutes away from Glen Park Village, BART, Safeway and Highway 101.',
  })
];

app.post('/generate', async (req, res) => {
  try {
    const tagsByGroupId = req.body.tags || {};
    const address = req.body.address || '';
    const numRooms = req.body.numRooms || 2;
    const numBathrooms = req.body.numBathrooms || 1;
  
    const tags = [];
    if (!!address) tags.push(address);
    tags.push(`${numRooms} rooms, ${numBathrooms} bathrooms`);
    Object.keys(tagsByGroupId).map((groupId) => tags.push(...tagsByGroupId[groupId]));
  
    const prompt = [
      ...trainingData,
      createSample({keywords: tags.join('. ')}),
    ].join(SAMPLE_SEPARATOR);
  
    const gptResponse = await request.post({
      url: 'https://api.openai.com/v1/engines/davinci/completions',
      auth: {
        bearer: process.env.OPENAI_API_KEY,
      },
      json: true,
      body: {
        prompt,
        max_tokens: 300,
        stop: STOP_PHRASE,
      }
    });
  
    res.json({
      ok: true,
      data: gptResponse.choices[0].text.trim(),
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message })
  }
});

module.exports = app;
