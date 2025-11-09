import { type NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { ElectricityReading, TokenPurchase } from "@/lib/types";

export async function POST(request: NextRequest) {
    try {
        const { month, readings, tokens } = await request.json();

        if (!month || !readings) {
            return NextResponse.json(
                { error: "Month and readings data are required" },
                { status: 400 }
            );
        }

        // Filter data for the selected month
        const [year, monthNum] = month.split("-");
        const monthReadings = readings.filter((reading: ElectricityReading) => {
            const date = new Date(reading.timestamp);
            return (
                date.getFullYear() === Number(year) &&
                date.getMonth() === Number(monthNum) - 1
            );
        });

        const monthTokens = tokens.filter((token: TokenPurchase) => {
            const date = new Date(token.timestamp);
            return (
                date.getFullYear() === Number(year) &&
                date.getMonth() === Number(monthNum) - 1
            );
        });

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Header
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("Electricity Usage Report", pageWidth / 2, 30, {
            align: "center",
        });

        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        const monthName = new Date(
            Number(year),
            Number(monthNum) - 1,
            1
        ).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
        });
        doc.text(monthName, pageWidth / 2, 45, { align: "center" });

        // Summary Statistics
        let yPosition = 70;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Summary", 20, yPosition);

        yPosition += 15;
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        // Calculate statistics
        const totalReadings = monthReadings.length;
        const totalTokens = monthTokens.reduce(
            (sum: number, token: TokenPurchase) => sum + token.units,
            0
        );

        let totalUsage = 0;
        for (let i = 1; i < monthReadings.length; i++) {
            const usage =
                monthReadings[i - 1].reading - monthReadings[i].reading;
            if (usage > 0) totalUsage += usage;
        }

        const avgDailyUsage =
            totalUsage /
            Math.max(1, new Date(Number(year), Number(monthNum), 0).getDate());

        doc.text(`Total Readings: ${totalReadings}`, 20, yPosition);
        yPosition += 10;
        doc.text(`Total Usage: ${totalUsage.toFixed(2)} kWh`, 20, yPosition);
        yPosition += 10;
        doc.text(
            `Average Daily Usage: ${avgDailyUsage.toFixed(2)} kWh`,
            20,
            yPosition
        );
        yPosition += 10;
        doc.text(
            `Tokens Purchased: ${totalTokens.toFixed(2)} kWh`,
            20,
            yPosition
        );

        // Readings Table
        yPosition += 25;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Daily Readings", 20, yPosition);

        yPosition += 15;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");

        // Table headers
        doc.text("Date", 20, yPosition);
        doc.text("Time", 60, yPosition);
        doc.text("Period", 100, yPosition);
        doc.text("Reading (kWh)", 140, yPosition);

        yPosition += 5;
        doc.line(20, yPosition, pageWidth - 20, yPosition); // Header line

        yPosition += 10;
        doc.setFont("helvetica", "normal");

        // Table data
        monthReadings
            .sort(
                (
                    a: { timestamp: string | number | Date },
                    b: { timestamp: string | number | Date }
                ) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
            )
            .forEach((reading: ElectricityReading) => {
                if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = 30;
                }

                const date = new Date(reading.timestamp);
                doc.text(date.toLocaleDateString(), 20, yPosition);
                doc.text(date.toLocaleTimeString(), 60, yPosition);
                doc.text(reading.period, 100, yPosition);
                doc.text(reading.reading.toString(), 140, yPosition);
                yPosition += 8;
            });

        // Token Purchases
        if (monthTokens.length > 0) {
            yPosition += 15;
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("Token Purchases", 20, yPosition);

            yPosition += 15;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");

            doc.text("Date", 20, yPosition);
            doc.text("Units (kWh)", 80, yPosition);
            doc.text("Cost", 140, yPosition);

            yPosition += 5;
            doc.line(20, yPosition, pageWidth - 20, yPosition);

            yPosition += 10;
            doc.setFont("helvetica", "normal");

            monthTokens.forEach((token: TokenPurchase) => {
                if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = 30;
                }

                const date = new Date(token.timestamp);
                doc.text(date.toLocaleDateString(), 20, yPosition);
                doc.text(token.units.toString(), 80, yPosition);
                doc.text(
                    token.total_cost
                        ? `$${token.total_cost.toFixed(2)}`
                        : "N/A",
                    140,
                    yPosition
                );
                yPosition += 8;
            });
        }

        // Footer
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(
                `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: "center" }
            );
        }

        // Generate PDF buffer
        const pdfBuffer = doc.output("arraybuffer");

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="electricity-report-${month}.pdf"`,
            },
        });
    } catch (error) {
        console.error("PDF generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF report" },
            { status: 500 }
        );
    }
}
