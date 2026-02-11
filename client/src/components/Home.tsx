import bicycle from "../assets/bicycle.svg"
import scooter from "../assets/scooter.svg"
import cars from "../assets/carshare.svg"

export default () => {
    return <div>
        <h1 className="text-9xl py-20">HOME</h1>
        <div className="flex flex-col gap-y-10">
            <img src={bicycle} alt="bicycle icon" />
            <img src={scooter} alt="scooter icon" />
            <img src={cars} alt="cars icon" />
        </div>
    </div>
}