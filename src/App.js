import Calendar from "rc-year-calendar";
import "./App.css";
import { useEffect, useMemo, useRef, useState } from "react";

const diffDays = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay)) + 1;
};

function App() {
  const [trips, setTrips] = useState([]);
  const [range, setRange] = useState([null]);
  const tripsRef = useRef([]);
  const rangeRef = useRef([null]);

  const isExistingTripDate = (date) =>
    tripsRef.current.some(([startTripDate, endTripDate]) => {
      let tripDate = new Date(startTripDate);
      while (tripDate <= endTripDate) {
        if (tripDate.getTime() === date.getTime()) {
          return true;
        }
        tripDate.setDate(tripDate.getDate() + 1);
      }

      return false;
    });

  const onDayClick = ({ date }) => {
    const alreadyTripDate = isExistingTripDate(date);
    console.log({ alreadyTripDate });
    if (alreadyTripDate) {
      rangeRef.current = [null];
    } else {
      const [startRange, endRange] = rangeRef.current;
      if (startRange && endRange) {
        rangeRef.current = [date];
      } else if (!startRange) {
        rangeRef.current = [date];
      } else if (startRange < date) {
        rangeRef.current = [startRange, date];
      } else if (startRange > date) {
        rangeRef.current = [date];
      }
    }

    setRange(rangeRef.current);
  };

  const addTrip = () => {
    console.log("addTrip", range, rangeRef.current);
    tripsRef.current = [...tripsRef.current, rangeRef.current];
    rangeRef.current = [null];
    setRange(rangeRef.current);
    setTrips(tripsRef.current);
  };

  const getTripsAndRange = () => {
    const tripsAndRange = [...tripsRef.current];
    if (rangeRef.current.length === 2) {
      tripsAndRange.push(rangeRef.current);
    }
    return tripsAndRange;
  };

  const dataSource = useMemo(() => {
    return getTripsAndRange().map(
      ([tripStartDate, tripEndDate], tripIndex) => ({
        id: tripIndex,
        startDate: tripStartDate,
        endDate: tripEndDate,
      })
    );
  }, [trips, range]);

  const usedAllowanceUntilDate = (date) => {
    let daysCountingTowardsAllowance = 0;

    const countbackDate = new Date(date);
    countbackDate.setDate(countbackDate.getDate() - 180);

    getTripsAndRange().forEach(([startTripDate, endTripDate]) => {
      let tripDate = new Date(startTripDate);
      while (tripDate <= endTripDate) {
        if (tripDate >= countbackDate && tripDate < date) {
          daysCountingTowardsAllowance += 1;
        }

        tripDate.setDate(tripDate.getDate() + 1);
      }
    });

    return daysCountingTowardsAllowance;
  };

  const customDayRenderer = (cellContent, date) => {
    const daysUsed = usedAllowanceUntilDate(date);
    cellContent.dataset.daysAvailable = 90 - daysUsed;
    cellContent.textContent = date.getDate();
  };

  const removeTrip = (tripIndex) => {
    const newTrips = [...tripsRef.current];
    newTrips.splice(tripIndex, 1);
    tripsRef.current = newTrips;
    setTrips(tripsRef.current);
  };

  // load trips on load
  useEffect(() => {
    try {
      const cachedTrips = JSON.parse(window.localStorage.getItem("trips"));
      const cachedTripsDates = cachedTrips.map(
        ([tripStartDate, tripEndDate]) => [
          new Date(tripStartDate),
          new Date(tripEndDate),
        ]
      );
      tripsRef.current = cachedTripsDates;
      setTrips(tripsRef.current);
    } catch (e) {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem("trips", JSON.stringify(tripsRef.current));
  }, [trips]);

  return (
    <div className="app">
      <div>
        <h2>Trips</h2>
        <ul className="trips">
          {trips.map(([tripStartDate, tripEndDate], tripIndex) => {
            const affectsStart = new Date(tripStartDate);
            affectsStart.setDate(affectsStart.getDate() + 180);

            const affectsEnd = new Date(tripEndDate);
            affectsEnd.setDate(affectsEnd.getDate() + 180);

            return (
              <li key={tripIndex}>
                {tripStartDate.toLocaleDateString()} -{" "}
                {tripEndDate.toLocaleDateString()}
                <ul>
                  <li>
                    {affectsStart.toLocaleDateString()} -{" "}
                    {affectsEnd.toLocaleDateString()}
                  </li>
                  <li>{diffDays(tripStartDate, tripEndDate)}</li>
                </ul>
                <button onClick={() => removeTrip(tripIndex)}>
                  Remove Trip
                </button>
              </li>
            );
          })}
        </ul>
        <br />
        {range.length === 2 && <button onClick={addTrip}>Add Trip</button>}
      </div>
      <div>
        <Calendar
          onDayClick={onDayClick}
          dataSource={dataSource}
          customDayRenderer={customDayRenderer}
        />
      </div>
    </div>
  );
}

export default App;
