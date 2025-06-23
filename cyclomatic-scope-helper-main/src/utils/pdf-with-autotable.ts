/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

(autoTable as any)(jsPDF);

export default jsPDF;
