import bicycle from "../assets/bicycle.svg"
import scooter from "../assets/scooter.svg"
import cars from "../assets/carshare.svg"
import { useNavigate } from "react-router-dom"

export default function HomePage() {
  const navigate = useNavigate()

  const services = [
    {
      icon: bicycle,
      alt: "bicycle icon",
      label: "Bikes",
      description: "Explore the city at your own pace",
      path: "/rent-bike",
    },
    {
      icon: scooter,
      alt: "scooter icon",
      label: "E-Scooters",
      description: "Quick trips across town",
      path: "/rent-escooter",
    },
    {
      icon: cars,
      alt: "cars icon",
      label: "Cars",
      description: "Longer journeys, more comfort",
      path: "/rent-car",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">

    <div className="space-y-3">
        <h1 className="text-5xl font-bold">
            SUMMS
        </h1>
        <h2 className="text-2xl font-semibold">Our mission</h2>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
        SUMMS (Smart Urban Mobility Management System) is a full-stack web application that enables citizens to search, reserve, and return shared mobility vehicles: bicycles, electric scooters, and cars
        <br></br>
        We Aim to Tackle The challenges Modern cities face; managing diverse urban mobility services: shared bicycles, electric scooters, ride-sharing vehicles, public transit, and parking infrastructure
        </p>
    </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Get moving with SUMMS
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl">
          Rent bikes, e-scooters, and cars across the city. Pick up anywhere, drop off anywhere.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate("/rent")}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            Browse vehicles
          </button>
          <button
            onClick={() => navigate("/startTrip")}
            className="px-5 py-2.5 rounded-xl border text-sm font-semibold hover:bg-muted"
          >
            Plan a trip
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => (
          <button
            key={service.label}
            onClick={() => navigate(service.path)}
            className="group text-left rounded-2xl border bg-card p-6 space-y-4 hover:bg-muted/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <img src={service.icon} alt={service.alt} className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-base">{service.label}</p>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          </button>
        ))}
      </div>

      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/parking")}
          className="text-left rounded-2xl border bg-card p-6 hover:bg-muted/50 transition-colors space-y-1"
        >
          <p className="font-semibold">Reserve parking</p>
          <p className="text-sm text-muted-foreground">Find and book a spot before you arrive</p>
        </button>
        <button
          onClick={() => navigate("/startTrip")}
          className="text-left rounded-2xl border bg-card p-6 hover:bg-muted/50 transition-colors space-y-1"
        >
          <p className="font-semibold">Plan a trip</p>
          <p className="text-sm text-muted-foreground">Choose your route and open Google Maps</p>
        </button>
      </div>

    </div>
  )
}