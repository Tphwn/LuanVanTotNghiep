const STEPS = [
  { id: 1, label: 'Xem lại' },
  { id: 2, label: 'Thanh toán' },
];

const BookingFlowStepper = ({ current = 1 }) => (
  <ol className="booking-flow-stepper" aria-label="Tiến trình đặt phòng">
    {STEPS.map((step, index) => {
      const active = step.id === current;
      const done = step.id < current;
      return (
        <li
          key={step.id}
          className={[
            'booking-flow-step',
            active ? 'is-active' : '',
            done ? 'is-done' : '',
          ].filter(Boolean).join(' ')}
        >
          {index > 0 && <span className="booking-flow-step-line" aria-hidden />}
          <span className="booking-flow-step-badge">{step.id}</span>
          <span className="booking-flow-step-label">{step.label}</span>
        </li>
      );
    })}
  </ol>
);

export default BookingFlowStepper;
