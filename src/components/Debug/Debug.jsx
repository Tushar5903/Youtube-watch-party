import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { serverPath } from "../../utils/utils";
import { useFetch } from "../../utils/";
import CountUp from "react-countup";
import { Table } from "@mantine/core";

const timeSeriesUrl = serverPath + `/timeSeries${window.location.search}`;
const statsUrl = serverPath + `/stats${window.location.search}`;

const Debug = () => {
  const fetchResult = useFetch(timeSeriesUrl);
  const timeSeries = fetchResult || [];
  const rev = [...timeSeries].reverse();
  
  const [state, setState] = useState({
    current: {},
    last: {},
  });

  useEffect(() => {
    let lastValue = state.current;

    const update = async () => {
      try {
        const resp = await fetch(statsUrl);
        const json = await resp.json();
        
        const nextState = { current: json, last: lastValue };
        setState(nextState);
        
        // Save the value for the next update cycle
        lastValue = nextState.current;
      } catch (error) {
        console.error("Failed to fetch debug stats:", error);
      }
    };

    update();
    const interval = setInterval(update, 10000);

    return () => clearInterval(interval);
  }, []);

  // Get the keys from the most recent element to determine chart lines
  const lastItem = timeSeries[timeSeries.length - 1] || {};
  const keys = Object.keys(lastItem);

  return (
    <div>
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          flexWrap: "wrap",
          flexDirection: "column",
          height: "2000px",
        }}
      >
        {Object.keys(state.current).map((k) => {
          if (k === "vmManagerStats") {
            return (
              <div key={k} style={{ overflow: "auto" }}>
                <pre style={{ fontSize: 12 }}>
                  {JSON.stringify(state.current[k], null, 2)}
                </pre>
              </div>
            );
          } else if (Array.isArray(state.current[k])) {
            // One column table for arrays
            return (
              <div
                key={k}
                style={{
                  maxWidth: k === "currentRoomData" ? "400px" : undefined,
                  overflow: "auto",
                }}
              >
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{k}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {state.current[k].map((row, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          {k === "currentRoomData" ? (
                            <div style={{ wordBreak: "break-all" }}>
                              {JSON.stringify(row, null, 2)}
                            </div>
                          ) : (
                            row
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            );
          } else {
            // Two column table for Objects/Maps
            return (
              <div key={k} style={{ overflow: "auto" }}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th colSpan={2}>{k}</Table.Th>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Th>Key</Table.Th>
                      <Table.Th>Value</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {Object.keys(state.current[k]).map((key) => (
                      <Table.Tr key={key}>
                        <Table.Td>{key}</Table.Td>
                        <Table.Td>
                          <CountUp
                            start={state.last[k]?.[key] ?? state.current[k][key]}
                            end={state.current[k][key]}
                            duration={10}
                            delay={0}
                            useEasing={false}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            );
          }
        })}
      </div>

      {/* Render Time Series Charts */}
      {keys
        .filter((k) => k !== "time")
        .map((key) => (
          <div key={key} style={{ marginBottom: "20px" }}>
            <h3 style={{ marginLeft: "20px" }}>{key}</h3>
            <LineChart
              width={1400}
              height={400}
              data={rev}
              margin={{
                top: 5,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={key} 
                stroke="#8884d8" 
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </div>
        ))}
    </div>
  );
};

export default Debug;