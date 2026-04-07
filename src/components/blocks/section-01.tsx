'use client'

const Section01 = () => {
  return (
    <section className="flex flex-1 flex-col max-w-7xl mx-auto justify-between gap-6 overflow-x-hidden py-4 sm:gap-10 sm:py-10 lg:gap-24 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 text-center sm:gap-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl leading-[1.29167] font-bold text-balance sm:text-3xl lg:text-5xl">
          Why Partner With Us?
          <br />
          <span className="relative">
            Because
            <svg
              width="223"
              height="12"
              viewBox="0 0 223 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-x-0 bottom-0 w-full translate-y-1/2 max-sm:hidden"
            >
              <path
                d="M1.11716 10.428C39.7835 4.97282 75.9074 2.70494 114.894 1.98894C143.706 1.45983 175.684 0.313587 204.212 3.31596C209.925 3.60546 215.144 4.59884 221.535 5.74551"
                stroke="url(#paint0_linear_10365_68643)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_10365_68643"
                  x1="18.8541"
                  y1="3.72033"
                  x2="42.6487"
                  y2="66.6308"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--primary)" />
                  <stop offset="1" stopColor="var(--primary-foreground)" />
                </linearGradient>
              </defs>
            </svg>
          </span>{" "}
          we deliver excellence that drives your business forward
        </h1>

        <div className="mt-6 sm:mt-12 lg:mt-24 grid grid-cols-3 gap-x-6 gap-y-6 sm:gap-x-10 sm:gap-y-10 lg:gap-y-16 justify-center">
          <div className="max-w-3xs">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold">
              99.8%
            </span>
            <p className="mt-2 sm:mt-3 lg:mt-6 text-sm sm:text-base lg:text-lg">
              Quality pass rate with rigorous quality control standards
            </p>
          </div>
          <div className="max-w-3xs">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold">
              98%
            </span>
            <p className="mt-2 sm:mt-3 lg:mt-6 text-sm sm:text-base lg:text-lg">
              On-time delivery rate across all bulk orders and shipments
            </p>
          </div>
          <div className="max-w-3xs">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold">
              85%
            </span>
            <p className="mt-2 sm:mt-3 lg:mt-6 text-sm sm:text-base lg:text-lg">
              Client retention rate with repeat orders and long-term
              partnerships
            </p>
          </div>
        </div>
      </div>

      {/* Image */}
      <img
        src="https://kitchen-utensils.s3.ap-southeast-1.amazonaws.com/62821ce92c_215617842b.webp"
        alt="Dishes"
        className="min-h-67 w-full object-cover"
      />
    </section>
  );
};

export default Section01;
