import React, { useRef } from "react";
import { Stage, Layer, Image, Rect} from "react-konva";
import useImage from 'use-image'

const DrawAnnotations = ( props: any ) => {
  const { images, highlightBoxes } = props
  const [ image ] = useImage( images )
  const imgRef = useRef<any>()

  return (
    <div>
      <Stage
        width={ 1280 }
        height={ 700 }
      >
        <Layer >
          <Image image={ image } ref={ imgRef } />
          {
            highlightBoxes.map((box, i) => (
              <Rect x={ box.bbox.x0 } y={ box.bbox.y0 } width={ box.bbox.x1 - box.bbox.x0 } height={ box.bbox.y1 - box.bbox.y0 } fill='yellow' opacity={ 0.5 } />
            ))
          }
        </Layer>
      </Stage>
    </div>
  );
};

export default DrawAnnotations