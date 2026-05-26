import Image from 'next/image'

const FlowerPaintings = () => {
  const pcImages = [
    '/painting1.jpg',
    '/painting2.jpg',
    '/painting3.jpg',
    '/painting4.jpg',
    '/painting5.jpg',
    '/painting6.jpg',
    '/painting4.jpg',
    '/painting2.jpg',
    '/painting1.jpg',
  ]

  const mobileImages = [
    '/painting1.jpg',
    '/painting2.jpg',
    '/painting5.jpg',
    '/painting6.jpg',
    '/painting4.jpg',
  ]

  return (
    // Black bg matches the PDF p13 footer where the floral row sits at
    // the top of the footer section against the dark panel. Tight
    // vertical padding (py-6) so the row + footer columns + copyright
    // bar all fit in laptop-class viewports.
    <div className="py-6 bg-black">
      <div className="container mx-auto">
        {/* Mobile View */}
        <div className="flex justify-center items-center gap-4 md:hidden">
          {mobileImages.map((src, index) => (
            <div key={index} className="w-16 h-16 rounded-full overflow-hidden">
              <Image
                src={src}
                alt={`Painting ${index + 1}`}
                width={64}
                height={64}
                loading="eager"
                className="object-cover w-full h-full scale-150"
              />
            </div>
          ))}
        </div>

        {/* PC View */}
        <div className="hidden md:flex justify-center items-center gap-8">
          {pcImages.map((src, index) => (
            <div key={index} className="w-28 h-28 rounded-full overflow-hidden">
              <Image
                src={src}
                alt={`Painting ${index + 1}`}
                width={112}
                height={112}
                loading="eager"
                className="object-cover w-full h-full scale-150"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FlowerPaintings
