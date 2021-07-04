import translate from 'translate';
import { API_VERSION, TRANSLATE_ENGINE } from '../configs/server';

export const translateText = async(req, res) => {
    const { from, to } = req.query;
    const { text } = req.body;

    if(!from || !to || !text) return res.status(400).json({
        apiVersion: API_VERSION,
        error: {
            code: 500,
            message: 'Invalid response!',
        }
    });

    try{
        const translateConfig = {
          engine : TRANSLATE_ENGINE,
          from,
          to,
          key : process.env.TRANSLATE_KEY,
        };
        const result = await translate(text, translateConfig);

        return res.json({
          apiVersion: API_VERSION,
          data: result,
        })
    }catch(err){
        console.log(`Error when trying to translate from ${from} to ${to}`);
        console.log(err);

        res.status(500).json({
            apiVersion: API_VERSION,
            error: {
            code: 500,
            message: `Internal server error when translate from ${from} to ${to}`,
            }
        })
    }
}