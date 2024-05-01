import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import '../styles/home.css';
import supabase from '../supabase';


function Face_check() {
    const [isLoadingModel, setIsLoadingModel] = useState(true);
    const videoRef = useRef();
    const canvasRef = useRef();
    const inputRef = useRef(null);
    const [currentLabel, setCurrentLabel] = useState('');

    useEffect(() => {
        const loadModelsAndStart = async () => {
            try {
                setIsLoadingModel(true);
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/weights'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/weights'),
                    faceapi.nets.faceExpressionNet.loadFromUri('/weights'),
                    faceapi.nets.ssdMobilenetv1.loadFromUri('/weights'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/weights')
                ]);

                const video = videoRef.current;
                const canvas = canvasRef.current;



                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                video.srcObject = stream;
                // await video.play();
                video.onloadedmetadata = async () => {
                    const displaySize = { width: video.videoWidth, height: video.videoHeight };
                    faceapi.matchDimensions(canvas, displaySize);

                    const { data: table_4 } = await supabase.from('테이블4').select('*');
                    

                    const students = table_4.map(student => ({
                        name: student.이름,
                        image: student.이미지주소,
                        
                    }));

                    
                    




                    const labeledFaceDescriptors = await Promise.all(
                        students.map(async student => {
                            const image = await faceapi.fetchImage(student.image);
                            const detections = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
                            if (!detections) {
                                throw new Error(`학생 에러 발생 ㅇ = ${student.name}`);
                            }
                            return new faceapi.LabeledFaceDescriptors(student.name, [detections.descriptor]);
                        })
                    );




                    

                    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

                    const detectAndMatchFaces = async () => {
                        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
                        const resizedDetections = faceapi.resizeResults(detections, displaySize);
                        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

                        resizedDetections.forEach(detection => {
                            const { x, y, width, height } = detection.detection.box;
                            const centerX = x + width / 2;
                            const centerY = y + height / 2;

                            const offsetX = centerX - displaySize.width / 2;
                            const offsetY = centerY - displaySize.height / 2;

                            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                            const box = new faceapi.draw.DrawBox(detection.detection.box, { label: bestMatch.label });
                            box.draw(canvas, { x: detection.detection.box.x - offsetX, y: detection.detection.box.y - offsetY });

                            const landmarks = new faceapi.draw.DrawFaceLandmarks(detection.landmarks, { drawLines: true, color: 'blue' });
                            landmarks.draw(canvas, { x: detection.detection.box.x - offsetX, y: detection.detection.box.y - offsetY });

                            setCurrentLabel(bestMatch.label);
                        });

                        requestAnimationFrame(detectAndMatchFaces);
                    };

                    detectAndMatchFaces();
                };
                setIsLoadingModel(false);
            } catch (error) {
                console.error(error);
            }
        };

        loadModelsAndStart();
    }, []);








    const handleInputChange = async () => {
        const inputValue = inputRef.current.value;
        const { data, error } = await supabase.from('테이블3').select('*');

        if (inputValue === currentLabel) {

            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const hour = String(currentDate.getHours()).padStart(2, '0');
            const minute = String(currentDate.getMinutes()).padStart(2, '0');
            const second = String(currentDate.getSeconds()).padStart(2, '0');
            const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()];

            let found = false;



            for (let i = 0; i < data.length; i++) {
                if (data[i].이름 === currentLabel && !data[i].출석종료) {

                    await supabase.from('테이블3').update([{ 출석종료: `${hour}:${minute}:${second}` }])
                        .eq('이름', currentLabel);
                    console.log(currentLabel, "출석종료 추가");
                    found = true;

                    const statusElement = document.getElementById("status");
                    statusElement.classList.add("end");
                    statusElement.innerText = `${currentLabel}님 \n ${hour}시 ${minute}분 ${second}초 출석종료 완료`;
                    setTimeout(() => {
                        statusElement.innerText = '얼굴을 인식해주세요';
                        statusElement.classList.remove("end");
                    }, 2000);
                }
            }

            if (!found) {
                const statusElement = document.getElementById("status");
                statusElement.innerText = `${currentLabel}님 \n ${hour}시 ${minute}분 ${second}초 출석 완료`;

                await supabase.from('테이블3').insert([{ 이름: currentLabel, 날짜: `${year}-${month}-${day} (${dayOfWeek})`, 출석시작: `${hour}:${minute}:${second}` }]);
            }
        } else {
            const statusElement = document.getElementById("status");

            if (statusElement) {
                statusElement.classList.add("er");
                statusElement.innerText = "얼굴 또는 이름이 잘못 입력되었습니다.";

                setTimeout(() => {
                    statusElement.innerText = '얼굴을 인식해주세요';
                    statusElement.classList.remove("er");
                }, 2000);
            }
        }

    };




    useEffect(() => {
        inputRef.current.focus();
    }, []);





    return (
        <div id='wrap'>
            <h1 id='status'>{isLoadingModel ? '카메라 / 모델 로드 중' : '얼굴을 인식해주세요'}</h1>
            <div id='camera'>
                <video ref={videoRef} autoPlay muted id="video"></video>
                <canvas ref={canvasRef} id="overlay"></canvas>
            </div>
            <input ref={inputRef} type='text' placeholder='이름을 입력해주세요' onKeyDown={(event) => { if (event.key === 'Enter') { handleInputChange(); } }} />

            <button><Link to="/table">출석현황 보러가기</Link> </button>
        </div>

    );
}

export default Face_check;
