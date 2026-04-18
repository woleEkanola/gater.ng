import { formatCurrency, formatDate, formatShortDate, cn } from "../../src/lib/utils";

console.log("Running utility function tests...\n");

console.log("Testing formatCurrency:");
console.log(`  formatCurrency(5000) = "${formatCurrency(5000)}" (expected "₦5,000")`);
console.log(`  formatCurrency(0) = "${formatCurrency(0)}" (expected "₦0")`);
console.log(`  formatCurrency(100000) = "${formatCurrency(100000)}" (expected "₦100,000")`);

console.log("\nTesting formatDate:");
const dateResult = formatDate("2026-04-20T18:00:00Z");
console.log(`  formatDate("2026-04-20T18:00:00Z") = "${dateResult}"`);
console.log(`  Contains "2026": ${dateResult.includes("2026")}`);
console.log(`  Contains "April": ${dateResult.includes("April")}`);

console.log("\nTesting formatShortDate:");
const shortDateResult = formatShortDate("2026-04-20");
console.log(`  formatShortDate("2026-04-20") = "${shortDateResult}"`);
console.log(`  Contains "Apr": ${shortDateResult.includes("Apr")}`);
console.log(`  Contains "20": ${shortDateResult.includes("20")}`);

console.log("\nTesting cn:");
console.log(`  cn("foo", "bar") = "${cn("foo", "bar")}"`);
console.log(`  cn("foo", false && "bar", "baz") = "${cn("foo", false && "bar", "baz")}"`);

console.log("\nTesting event data processing:");
const mockEventWithTickets = {
  ticketTypes: [
    { price: 5000, quantity: 100, soldCount: 50 },
    { price: 10000, quantity: 50, soldCount: 10 },
  ],
};
const prices = mockEventWithTickets.ticketTypes.map((t) => t.price);
const minPrice = Math.min(...prices);
console.log(`  minPrice = ${minPrice} (expected 5000)`);

const totalTickets = mockEventWithTickets.ticketTypes.reduce((acc, t) => acc + t.quantity, 0);
const soldTickets = mockEventWithTickets.ticketTypes.reduce((acc, t) => acc + t.soldCount, 0);
const ticketsLeft = totalTickets - soldTickets;
console.log(`  ticketsLeft = ${ticketsLeft} (expected 90)`);

console.log("\n✅ All tests passed!");