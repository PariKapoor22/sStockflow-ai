import { createContext, useState } from "react";

export const CarbonContext = createContext();

export function CarbonProvider({ children }) {

  const [records, setRecords] = useState([]);

  const [latestRecord, setLatestRecord] = useState(null);

  function addRecord(record) {

    setRecords(prev => [...prev, record]);

    setLatestRecord(record);

  }

  return (

    <CarbonContext.Provider

      value={{

        records,

        latestRecord,

        addRecord

      }}

    >

      {children}

    </CarbonContext.Provider>

  );

}