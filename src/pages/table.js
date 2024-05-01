import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/table.css';
import supabase from '../supabase';

function Table() {
  const [data, setData] = useState([]);
  const [studentNames, setStudentNames] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  const fetchData2 = async () => {
    try {
      await axios.get('https://port-0-faceapi-flask-1pgyr2mlvjclpe0.sel5.cloudtype.app/');

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('테이블3').select('*');
      const sortedData = data.sort((a, b) => new Date(a.날짜) - new Date(b.날짜));
      setData(sortedData);
    }

    fetchData();
    fetchData2();
  }, []);

  const calculateWorkHours = (start, end) => {
    const startTimeParts = start.split(':').map(part => parseInt(part));
    const endTimeParts = end.split(':').map(part => parseInt(part));
    const startHour = startTimeParts[0];
    const startMinute = startTimeParts[1];
    const startSecond = startTimeParts[2];
    const endHour = endTimeParts[0];
    const endMinute = endTimeParts[1];
    const endSecond = endTimeParts[2];

    const startTotalSeconds = startHour * 3600 + startMinute * 60 + startSecond;
    const endTotalSeconds = endHour * 3600 + endMinute * 60 + endSecond;
    const timeDiffSeconds = endTotalSeconds - startTotalSeconds;

    const hours = Math.floor(timeDiffSeconds / 3600);
    const minutes = Math.floor((timeDiffSeconds % 3600) / 60);
    const seconds = timeDiffSeconds % 60;

    return `${hours}시간 ${minutes}분 ${seconds}초`;
  };

  const isToday = (someDate) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  };

  const handleStudentSelect = (studentName) => {
    setSelectedStudent(studentName);
  };

  useEffect(() => {
    async function fetchStudentNames() {
      const { data } = await supabase.from('테이블4').select('이름');
      const uniqueStudentNames = [...new Set(data.map(item => item.이름))];
      setStudentNames(uniqueStudentNames);
    }

    fetchStudentNames();
  }, []);

  return (
    <div id='table_page'>
      <select onChange={(e) => handleStudentSelect(e.target.value)} value={selectedStudent}>
        <option value="">전체 학생</option>
        {studentNames.map((name, index) => (
          <option key={index} value={name}>{name}</option>
        ))}
      </select>
      <div id='table_wrap'>
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>날짜</th>
              <th>출석시작</th>
              <th>출석종료</th>
              <th>작업 시간</th>
            </tr>
          </thead>
          <tbody>
            {data
              .filter(item => !selectedStudent || item.이름 === selectedStudent)
              .map((item, index) => (
                <tr key={index} style={{ backgroundColor: isToday(new Date(item.날짜)) ? (item.출석종료 ? 'lightgreen' : 'yellow') : 'inherit' }}>
                  <td>{item.이름}</td>
                  <td>{item.날짜}</td>
                  <td>{item.출석시작}</td>
                  <td>{item.출석종료 || '출석종료 X'}</td>
                  <td>{item.출석종료 && calculateWorkHours(item.출석시작, item.출석종료) || '출석종료계산 불가'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <button><Link to="/">돌아가기</Link></button>
    </div>
  );
}

export default Table;
