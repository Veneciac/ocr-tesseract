import Tesseract, { Word, Worker } from 'tesseract.js';
import moment from 'moment';

// add id to ocr words
export interface OcrWord extends Word {
  id: number;
  x: number;
  y: number;
  x1: number;
  y1: number;
}

type Patient = {
  birthdate: string;
  name: string;
}
export interface Position {
  x: number;
  y: number;
  x1: number;
  y1: number;
  id: number[];
  key: number;
}

const format = [
  
  // WITH SLASH
  // MONTH DATE YEAR
  'M/D/YYYY',
  'M/D/YY',
  'MM/D/YYYY',
  'MM/D/YY',
  'M/DD/YYYY',
  'M/DD/YY',
  'MM/DD/YYYY',
  'MM/DD/YY',

  // DATE MONTH YEAR
  'D/M/YYYY',
  'D/M/YY',
  'DD/M/YYYY',
  'DD/M/YY',
  'D/MM/YYYY',
  'D/MM/YY',
  'DD/MM/YYYY',
  'DD/MM/YY',

  // YEAR MONTH DATE
  'YYYY/M/D',
  'YY/M/D',
  'YYYY/MM/D',
  'YY/MM/D',
  'YYYY/M/DD',
  'YY/M/DD',
  'YYYY/MM/DD',
  'YY/MM/DD',

  // YEAR DATE MONTH
  'YYYY/D/M',
  'YY/D/M',
  'YYYY/DD/M',
  'YY/DD/M',
  'YYYY/D/MM',
  'YY/D/MM',
  'YYYY/DD/MM',
  'YY/DD/MM',

  // / WITH DASH
  // MONTH DATE YEAR
  'M-D-YYYY',
  'M-D-YY',
  'MM-D-YYYY',
  'MM-D-YY',
  'M-DD-YYYY',
  'M-DD-YY',
  'MM-DD-YYYY',
  'MM-DD-YY',
  
  // DATE MONTH YEAR
  'D-M-YYYY',
  'D-M-YY',
  'DD-M-YYYY',
  'DD-M-YY',
  'D-MM-YYYY',
  'D-MM-YY',
  'DD-MM-YYYY',
  'DD-MM-YY',
  
  // YEAR MONTH DATE
  'YYYY-M-D',
  'YY-M-D',
  'YYYY-MM-D',
  'YY-MM-D',
  'YYYY-M-DD',
  'YY-M-DD',
  'YYYY-MM-DD',
  'YY-MM-DD',
  
  // YEAR DATE MONTH
  'YYYY-D-M',
  'YY-D-M',
  'YYYY-DD-M',
  'YY-DD-M',
  'YYYY-D-MM',
  'YY-D-MM',
  'YYYY-DD-MM',
  'YY-DD-MM',

  'MMM-DD-YYYY',

];

// date format with space
const formatWithSpace = [
  'D MMMM, YYYY',
  'D MMM, YYYY',
  // ////
  'MMMM D, YYYY',
  'MMMM D, YY',
  'MMM D, YYYY',
  'MMM D, YY',

  'MMMM DD, YYYY',
  'MMMM DD, YY',
  'MMM DD, YYYY',
  'MMM DD, YY',

  'MMMM Do, YYYY',
  'MMMM Do, YY',
  'MMM Do, YYYY',
  'MMM Do, YY',

  // ////////
  'YYYY, MMMM D',
  'YY, MMMM D',
  'YYYY, MMM D',
  'YY, MMM D',

  'YYYY, MMMM DD',
  'YY, MMMM DD',
  'YYYY, MMM DD',
  'YY, MMM DD',

  'YYYY, MMMM Do',
  'YY, MMMM Do',
  'YYYY, MMM Do',
  'YY, MMM Do',

  // MONTH DATE YEAR
  'M D YYYY',
  'M D YY',
  'MM D YYYY',
  'MM D YY',
  'M DD YYYY',
  'M DD YY',
  'MM DD YYYY',
  'MM DD YY',
  
  // DATE MONTH YEAR
  'D M YYYY',
  'D M YY',
  'DD M YYYY',
  'DD M YY',
  'D MM YYYY',
  'D MM YY',
  'DD MM YYYY',
  'DD MM YY',
  
  // YEAR MONTH DATE
  'YYYY M D',
  'YY M D',
  'YYYY MM D',
  'YY MM D',
  'YYYY M DD',
  'YY M DD',
  'YYYY MM DD',
  'YY MM DD',
  
  // YEAR DATE MONTH
  'YYYY D M',
  'YY D M',
  'YYYY DD M',
  'YY DD M',
  'YYYY D MM',
  'YY D MM',
  'YYYY DD MM',
  'YY DD MM',

  //
  'YY, MMM D',
  'YY, MMMM D',
  'YY, MMM DD',
  'YY, MMMM DD',

  'YYYY, MMM D',
  'YYYY, MMMM D',
  'YYYY, MMM DD',
  'YYYY, MMMM DD',
];

// get patient data from ocr
const getUserData = (arr: any, patient: Patient) => {
  let ocrWordResult: any = [];
  const dob = patient.birthdate;
  const socialSecurityNumberRegex = new RegExp('^(?!666|000|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0{4})\\d{4}$');

  // get coordinates of patient name
  ocrWordResult = getBoxes(patient.name, arr);
  // loop date format with space to get coordinates
  formatWithSpace.forEach(x => {
    ocrWordResult.concat(getBoxes(moment(dob).format(x), arr));
  });

  // loop array of ocr words to match patient dob with date format that did not contain space
  arr.forEach(word => {
    if (word.text.length > 5 && word.text.match('.*\\d+.*') && (word.text.includes('/') || word.text.includes('-'))) {
      const date = new Date(word.text);
      // format 2 digit years eg. 47 -> 1947
      if (Number(moment(date).format('YYYY')) > Number(moment().format('YYYY'))) {
        date.setFullYear(Number('19' + moment(date).format('YYYY')
          .substring(2, 4)));
      }
      // math patient dob
      if (moment(date).format('DD-MM-YYYY') === moment(new Date(dob)).format('DD-MM-YYYY')) {
        ocrWordResult.push(word);
      }
      // match patient social security number
    } else if (word.text.length === 10 && word.text.includes('-') && socialSecurityNumberRegex.test(word.text)) {
      ocrWordResult.push(word);
    }
  });

  return ocrWordResult;
};

// get date from ocr
const getDate = (arr: OcrWord[], dob: string) => {
  const result: OcrWord[] = [];
  const birthDate = new Date(dob);

  arr.forEach(word => {
    if (word.text.length > 5 && word.text.match('.*\\d+.*') && word.text.includes('/') || word.text.includes('-')) {
      const regex  = new RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$');
      const date = new Date(word.text);

      if (regex.test(String(date))) {
        if (date === birthDate) {
          result.push(word);
        }
      }
    }
  });

  return result;
};

// get social security number from ocr
const getSocialSecurityNumber = (arr: OcrWord[]) => {
  const regex = new RegExp('^(?!666|000|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0{4})\\d{4}$');
  const result: OcrWord[] = [];

  arr.forEach(word => {
    if (word.text.length === 10 && word.text.includes('-') && regex.test(word.text)) {
      result.push(word);
    }
  });
  return result;
};

// set Tesseract worker
const setWorker = (setWorker: (worker: any) => void, setStatus?: (key: string) => void, setProgress?: (key: number) => void,) => {
  const { createWorker } = Tesseract;

  // set worker from tesseract to callback
  setWorker(createWorker({
    logger: ({ status, progress }) =>  {
      // set status from ocr to callback
      if (setStatus) {
        setStatus(status);
      }

      // set progress from ocr to callback
      if (setProgress) {
        setProgress(progress);
      }
    },
  }));
};

// Recognize function from tesseract
const recognize: any = async(image: any, worker: Worker, lang?: string) => {
  try {
    // set lang if none
    if (!lang) {
      lang = 'eng';
    }

    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    // recognize
    const { data } = await worker.recognize(image);

    // remap data to give each words an id
    const ocrWords = data.words.map((word: Word, i: number) => {
      return {
        ...word,
        id: i
      };
    });

    // replace result data words with remapped word list with id
    const result = {
      ...data,
      words: ocrWords
    };

    return result;

  } catch (error) {
    console.log(error);
    return [];
  }
};

// Get ocr coordinates from word / sentence
// input , ocrwords is wordlist from ocr recognize function
const getBoxes = (input: string, ocrWords: any) => {
  // make input into an array / words splitted by spaces
  const arrInput = input.split(' ').filter(word => word !== '');

  const ocrWordList: any = [];

  // map input array
  arrInput.map(inputText => {
    // map each words to find word that match input
    ocrWords.forEach((word: Word) => {
      if (word.text.toLowerCase() === inputText.toLowerCase()) ocrWordList.push(word);
    });
  });

  // sort by id so words will be sorted by line and from the left
  ocrWordList.sort(function(a: OcrWord, b: OcrWord) {
    return a.id - b.id;
  });
  
  let OcrWordsResult: any = [];
  
  ocrWordList.forEach((currentOcrWord: OcrWord, i) => {
    // initialize bbox
    const bbox = {
      ...currentOcrWord,
      bbox: {
        x0: currentOcrWord.bbox.x0,
        y0: currentOcrWord.bbox.y0,
        x1: currentOcrWord.bbox.x1,
        y1: currentOcrWord.bbox.y1,
      },
      id: [currentOcrWord.id],
      key: i
    };
 
    if (i > 0) {
    // Check if the previous ocr word has an id that is one less than this ocr word's id. This means
    // that the ocr words are adjacent in the image and the current ocr word is to the right and down
    // relative to the previous ocr word.
      if (currentOcrWord.id - ocrWordList[i - 1].id === 1) {
        // Find a result (merged ocr words) that contains the previous ocr word's id, this will be
        // the existing set of merged ocr words that we add this word to
        OcrWordsResult.forEach((res, indexRes) => {
          const indexId = res.id.indexOf(ocrWordList[i - 1].id);
          if (indexId > -1) {
            // Merge the current ocr word into the merged ocr word collection that it is adjacent to by
            // extending the lower right bounded box corner to match the lower right corner of the
            // current ocr word's bounded box
            OcrWordsResult[indexRes] = {
              ...OcrWordsResult[indexRes],
              bbox: {
                ...OcrWordsResult[indexRes].bbox,
                x1: currentOcrWord.bbox.x1,
                y1: currentOcrWord.bbox.y1,
              },
              id: [...OcrWordsResult[indexRes].id, currentOcrWord.id]
            };
          }
        });
      } else {
        OcrWordsResult.push(bbox);
      }
    } else {
      OcrWordsResult.push(bbox);
    }
  });

  // filter out any words that only matches parts of the input
  OcrWordsResult = OcrWordsResult.filter(ocrWords => ocrWords.id.length === arrInput.length);
 
  return OcrWordsResult;
};

export {
  recognize,
  getBoxes,
  setWorker,
  getSocialSecurityNumber,
  getDate,
  getUserData
};