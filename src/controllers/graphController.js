const Graph = require("../models/Graph");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Fee = require("../models/Fee");
const StudentCompany = require("../models/StudentCompany");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// Helper function to generate graph data without canvas
const generateGraphDataOnly = async (userId, category, filters, userRole) => {
  switch (category) {
    case "academic":
      return await generateAcademicGraph(userId, filters, userRole);
    case "fees":
      return await generateFeesGraph(userId, filters, userRole);
    case "placement":
      return await generatePlacementGraph(userId, filters, userRole);
    case "performance":
      return await generatePerformanceGraph(userId, filters, userRole);
    default:
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Default Data",
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 1,
          },
        ],
      };
  }
};

// @desc    Create custom graph
// @route   POST /api/user/graphs
// @access  Private
const createGraph = async (req, res) => {
  try {
    const { title, type, category, isPublic, filters } = req.body;

    // Generate graph data based on category and filters
    let graphData = await generateGraphDataOnly(
      req.user._id,
      category,
      filters,
      req.user.role,
    );

    const graph = await Graph.create({
      title,
      type,
      data: graphData,
      category,
      createdBy: req.user._id,
      userRole: req.user.role,
      isPublic: isPublic || false,
      filters,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: title },
        },
      },
    });

    res.status(201).json(graph);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Generate Academic Graph
const generateAcademicGraph = async (userId, filters, userRole) => {
  let enrollmentData;

  if (userRole === "manager") {
    enrollmentData = await Enrollment.aggregate([
      {
        $group: {
          _id: { $month: "$enrollmentDate" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  } else {
    enrollmentData = await Enrollment.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: { $month: "$enrollmentDate" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const labels = enrollmentData.map(
    (d) => monthNames[d._id - 1] || `Month ${d._id}`,
  );
  const data = enrollmentData.map((d) => d.count);

  return {
    labels: labels.length ? labels : monthNames.slice(0, 6),
    datasets: [
      {
        label: "Course Enrollments",
        data: data.length ? data : [0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };
};

// Generate Fees Graph
const generateFeesGraph = async (userId, filters, userRole) => {
  let feeQuery = {};
  if (userRole !== "manager") {
    feeQuery.user = userId;
  }

  const feeData = await Fee.aggregate([
    { $match: feeQuery },
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        totalPaid: { $sum: "$paidAmount" },
        totalDue: { $sum: "$dueAmount" },
      },
    },
  ]);

  const labels = feeData.map((d) => d._id);
  const paidData = feeData.map((d) => d.totalPaid);
  const dueData = feeData.map((d) => d.totalDue);

  return {
    labels: labels.length ? labels : ["Pending", "Partial", "Paid", "Overdue"],
    datasets: [
      {
        label: "Paid Amount",
        data: paidData.length ? paidData : [0, 0, 0, 0],
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
      },
      {
        label: "Due Amount",
        data: dueData.length ? dueData : [0, 0, 0, 0],
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 1,
      },
    ],
  };
};

// Generate Placement Graph
const generatePlacementGraph = async (userId, filters, userRole) => {
  let applicationQuery = {};
  if (userRole !== "manager") {
    applicationQuery.user = userId;
  }

  const placementData = await StudentCompany.aggregate([
    { $match: applicationQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const labels = placementData.map((d) => d._id);
  const data = placementData.map((d) => d.count);

  return {
    labels: labels.length
      ? labels
      : ["Applied", "Shortlisted", "Selected", "Rejected"],
    datasets: [
      {
        label: "Applications Status",
        data: data.length ? data : [0, 0, 0, 0],
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)",
          "rgba(16, 185, 129, 0.5)",
          "rgba(245, 158, 11, 0.5)",
          "rgba(239, 68, 68, 0.5)",
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(239, 68, 68)",
        ],
        borderWidth: 1,
      },
    ],
  };
};

// Generate Performance Graph
const generatePerformanceGraph = async (userId, filters, userRole) => {
  // Example performance data - can be customized based on grades or metrics
  const performanceData = [
    { subject: "Mathematics", score: 85 },
    { subject: "Physics", score: 78 },
    { subject: "Computer Science", score: 92 },
    { subject: "English", score: 88 },
    { subject: "Chemistry", score: 76 },
  ];

  return {
    labels: performanceData.map((d) => d.subject),
    datasets: [
      {
        label: "Performance Score",
        data: performanceData.map((d) => d.score),
        backgroundColor: "rgba(139, 92, 246, 0.5)",
        borderColor: "rgb(139, 92, 246)",
        borderWidth: 2,
        fill: false,
        tension: 0.1,
      },
    ],
  };
};

// @desc    Get user's graphs
// @route   GET /api/user/graphs
// @access  Private
const getUserGraphs = async (req, res) => {
  try {
    const graphs = await Graph.find({
      $or: [{ createdBy: req.user._id }, { isPublic: true }],
    }).sort("-createdAt");

    res.json(graphs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get graph by ID
// @route   GET /api/user/graphs/:id
// @access  Private
const getGraphById = async (req, res) => {
  try {
    const graph = await Graph.findById(req.params.id);

    if (!graph) {
      return res.status(404).json({ message: "Graph not found" });
    }

    if (
      graph.createdBy.toString() !== req.user._id.toString() &&
      !graph.isPublic &&
      req.user.role !== "manager"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this graph" });
    }

    res.json(graph);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Download graph as CSV/Excel/JSON
// @route   GET /api/user/graphs/:id/download/:format
// @access  Private
const downloadGraph = async (req, res) => {
  try {
    const { id, format } = req.params;
    const graph = await Graph.findById(id);

    if (!graph) {
      return res.status(404).json({ message: "Graph not found" });
    }

    if (
      graph.createdBy.toString() !== req.user._id.toString() &&
      !graph.isPublic &&
      req.user.role !== "manager"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to download this graph" });
    }

    switch (format) {
      case "csv":
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=graph_${id}.csv`,
        );

        let csvData = "Labels";
        graph.data.datasets.forEach((ds) => {
          csvData += `,${ds.label}`;
        });
        csvData += "\n";

        graph.data.labels.forEach((label, index) => {
          csvData += `${label}`;
          graph.data.datasets.forEach((dataset) => {
            csvData += `,${dataset.data[index]}`;
          });
          csvData += "\n";
        });
        res.send(csvData);
        break;

      case "excel":
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Graph Data");

        // Add headers
        const headers = [
          "Labels",
          ...graph.data.datasets.map((ds) => ds.label),
        ];
        worksheet.addRow(headers);

        // Add data rows
        graph.data.labels.forEach((label, index) => {
          const row = [label];
          graph.data.datasets.forEach((dataset) => {
            row.push(dataset.data[index]);
          });
          worksheet.addRow(row);
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=graph_${id}.xlsx`,
        );

        await workbook.xlsx.write(res);
        res.end();
        break;

      case "json":
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=graph_${id}.json`,
        );
        res.json(graph);
        break;

      default:
        res
          .status(400)
          .json({ message: "Unsupported format. Use csv, excel, or json" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update graph
// @route   PUT /api/user/graphs/:id
// @access  Private
const updateGraph = async (req, res) => {
  try {
    const graph = await Graph.findById(req.params.id);

    if (!graph) {
      return res.status(404).json({ message: "Graph not found" });
    }

    if (graph.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this graph" });
    }

    const { title, type, isPublic, filters } = req.body;

    // Regenerate data if filters changed
    let graphData = graph.data;
    if (filters && JSON.stringify(filters) !== JSON.stringify(graph.filters)) {
      graphData = await generateGraphDataOnly(
        req.user._id,
        graph.category,
        filters,
        req.user.role,
      );
    }

    graph.title = title || graph.title;
    graph.type = type || graph.type;
    graph.data = graphData;
    graph.isPublic = isPublic !== undefined ? isPublic : graph.isPublic;
    graph.filters = filters || graph.filters;

    if (graph.options.plugins.title) {
      graph.options.plugins.title.text = graph.title;
    }

    await graph.save();

    res.json(graph);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete graph
// @route   DELETE /api/user/graphs/:id
// @access  Private
const deleteGraph = async (req, res) => {
  try {
    const graph = await Graph.findById(req.params.id);

    if (!graph) {
      return res.status(404).json({ message: "Graph not found" });
    }

    if (
      graph.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "manager"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this graph" });
    }

    await graph.deleteOne();

    res.json({ message: "Graph deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Bulk delete graphs
// @route   DELETE /api/user/graphs/bulk-delete
// @access  Private
const bulkDeleteGraphs = async (req, res) => {
  try {
    const { graphIds } = req.body;

    const result = await Graph.deleteMany({
      _id: { $in: graphIds },
      createdBy: req.user._id,
    });

    res.json({
      message: `${result.deletedCount} graphs deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Share graph (make public)
// @route   PUT /api/user/graphs/:id/share
// @access  Private
const shareGraph = async (req, res) => {
  try {
    const graph = await Graph.findById(req.params.id);

    if (!graph) {
      return res.status(404).json({ message: "Graph not found" });
    }

    if (graph.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to share this graph" });
    }

    graph.isPublic = true;
    await graph.save();

    res.json({ message: "Graph shared successfully", graph });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get graph statistics
// @route   GET /api/user/graphs/statistics
// @access  Private
const getGraphStatistics = async (req, res) => {
  try {
    const totalGraphs = await Graph.countDocuments({ createdBy: req.user._id });
    const publicGraphs = await Graph.countDocuments({
      createdBy: req.user._id,
      isPublic: true,
    });
    const graphsByCategory = await Graph.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({
      totalGraphs,
      publicGraphs,
      privateGraphs: totalGraphs - publicGraphs,
      graphsByCategory,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createGraph,
  getUserGraphs,
  getGraphById,
  downloadGraph,
  updateGraph,
  deleteGraph,
  bulkDeleteGraphs,
  shareGraph,
  getGraphStatistics,
};
