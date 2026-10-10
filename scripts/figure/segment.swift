import Foundation
import Vision
import CoreImage
import AppKit

let args = CommandLine.arguments
guard args.count == 3 else { fputs("usage: segment <in.jpg> <out-mask.png>\n", stderr); exit(2) }
let inURL = URL(fileURLWithPath: args[1]); let outURL = URL(fileURLWithPath: args[2])
guard let ciImage = CIImage(contentsOf: inURL) else { fputs("cannot read input\n", stderr); exit(1) }
let request = VNGeneratePersonSegmentationRequest()
request.qualityLevel = .accurate
request.outputPixelFormat = kCVPixelFormatType_OneComponent8
let handler = VNImageRequestHandler(ciImage: ciImage, options: [:])
try handler.perform([request])
guard let result = request.results?.first else { fputs("no result\n", stderr); exit(1) }
let maskCI = CIImage(cvPixelBuffer: result.pixelBuffer)
// scale mask to the source size
let sx = ciImage.extent.width / maskCI.extent.width
let sy = ciImage.extent.height / maskCI.extent.height
let scaled = maskCI.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
let ctx = CIContext()
guard let cg = ctx.createCGImage(scaled, from: CGRect(origin: .zero, size: ciImage.extent.size)) else { fputs("render failed\n", stderr); exit(1) }
let rep = NSBitmapImageRep(cgImage: cg)
guard let png = rep.representation(using: .png, properties: [:]) else { fputs("png failed\n", stderr); exit(1) }
try png.write(to: outURL)
print("mask written \(cg.width)x\(cg.height)")
