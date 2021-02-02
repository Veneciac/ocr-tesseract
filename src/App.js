import React, {useState, useEffect} from 'react'
import { Upload, Tag, Input, DatePicker, Row } from 'antd';
import {toDataUrl} from './helpers/image';
import {recognize, setWorker as ocrSetWorker, getUserData} from './helpers/ocr'
import DrawAnnotations from './DrawAnnotations';

import 'antd/dist/antd.css';
import './App.css';

function App() {
  const [captureBitmap, setCaptureBitmap] = useState(null);
  const [status, setOcrStatus] = useState('');
  const [progress, setOcrProgress] = useState('');
  const [worker, setWorker] = useState(null);
  const [image, setimage] = useState('');
  const [ocrData, setOcrData] = useState(null);
  const [highlightBoxes, setHighlightBoxes] = useState([]);
  
  const [input, setInput] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (captureBitmap) {
      setimage(toDataUrl(captureBitmap));
    }
  }, [captureBitmap]);

  // effect to set ocr worker
  useEffect(() => {
    if (image) {
      ocrSetWorker(key => setWorker(key), key => setOcrStatus(key), key => setOcrProgress(key) );
    }
  }, [image]);

  // effect to do OCR
  useEffect(() => {
    if (worker && image) {
      console.log('ini')
      recognize(image, worker).then(data => {
        console.log('result', data);
        setOcrData(data);
      });
    }
  }, [worker, image]);

  const defaultUploadProps = {
    beforeUpload: () => {
      return false;
    },
    showUploadList: false
  };

  const handleClickTakeScreenshot = async() => {
    // request share screen recording in the device
    const mediaDevices = navigator.mediaDevices;
    if (mediaDevices?.getDisplayMedia) {
      const stream = await mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' } });
      // get correct video track
      const track = stream.getVideoTracks()[0];
      // init Image Capture and not Video stream
      const imageCapture = new ImageCapture(track);
      // take first frame only
      const bitmap = await imageCapture.grabFrame();
      // destory video track to prevent more recording / mem leak
      track.stop();
      setCaptureBitmap(bitmap);

    } else {
      alert('Screenshot is only available in secure context. Please set your browser to pass this origin as secure')
    }
  };

  const handleChangeUpload = async(info) => {
    const file= info.file;
    // convert File to ImageBitmap
    const bitmap = await createImageBitmap(file);

    setCaptureBitmap(bitmap);
  };

  const onChangeDate = (date, dateString) =>  {
    setDate(dateString)
  }

  const onSearch = () => {
    const patientBox = getUserData(ocrData.words, {
      name: input,
      birthdate: date
    });
    if (patientBox.length !== 0) {
      console.log('result====', patientBox);
      setHighlightBoxes(patientBox);
    }
  }

  return (
    <div className="App">
      <h1 className='title'>Tesseract Ocr</h1>
      <p className='status'>{status} {progress}</p>
 
      {
        ocrData && <Row justify='center' align='middle'>
          <Input style={{
            width: '300px',
            marginRight: '20px'
          }} placeholder="Input" value={input} onChange={e => setInput(e.target.value)} />
          <DatePicker onChange={onChangeDate} />
          <button onClick={onSearch} className='btn-search'>
            Search
          </button>
        </Row> 
      }

      {
        image && <div style={{
          justifyContent: 'center',
          display: 'flex',
          marginTop: '20px'
        }}>   
          <DrawAnnotations images={ image } highlightBoxes={ highlightBoxes } />
        </div>
      }
      
      <div className='btn-container'>
        <button onClick={handleClickTakeScreenshot} className='btn-capture'>
          Capture Image
        </button>

        <Upload { ...defaultUploadProps } accept='image/png, image/jpeg' onChange={ handleChangeUpload }>
          <button className='btn-capture'>
            Upload Image
          </button>
        </Upload>
      </div>
      {
        ocrData && (
          <div >
            <h2 className='title'>Text</h2>
            <div className='text-container'>
              <p>
                {ocrData.text}
              </p>
            </div>
           
            <h2 className='title'>Words</h2>
            <div className='text-container'>
              <p>
                {ocrData.words.map(word =>  <Tag>{word.text}</Tag>)}
              </p>
            </div>
          </div>
        )
      }
    </div>
  );
}

export default App;
