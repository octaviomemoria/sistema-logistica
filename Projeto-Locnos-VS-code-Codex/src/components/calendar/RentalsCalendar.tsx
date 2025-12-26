import { addDays, eachDayOfInterval, endOfMonth, format, startOfMonth } from "date-fns";
import type { CalendarRental } from "../../services/rentalService";
import { RENTAL_STATUS_COLORS } from "../../utils/constants";

interface RentalsCalendarProps {
  rentals: CalendarRental[];
}

export const RentalsCalendar = ({ rentals }: RentalsCalendarProps) => {
  const reference = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(reference),
    end: endOfMonth(reference)
  });

  const rentalsByDate = rentals.reduce<Record<string, CalendarRental[]>>(
    (acc, rental) => {
      let cursor = new Date(rental.data_inicio);
      const final = new Date(rental.data_fim);
      while (cursor <= final) {
        const key = format(cursor, "yyyy-MM-dd");
        acc[key] = acc[key] ? [...acc[key], rental] : [rental];
        cursor = addDays(cursor, 1);
      }
      return acc;
    },
    {}
  );

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayRentals = rentalsByDate[key] ?? [];
        return (
          <div
            key={key}
            className="rounded-2xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm font-semibold text-slate-500">
              {format(day, "dd/MM")}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {dayRentals.slice(0, 3).map((rental) => (
                <span
                  key={rental.id}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${RENTAL_STATUS_COLORS[rental.status]}`}
                >
                  {rental.cliente?.nome_completo ?? rental.id}
                </span>
              ))}
              {dayRentals.length > 3 && (
                <p className="text-xs text-slate-400">
                  +{dayRentals.length - 3} locações
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


