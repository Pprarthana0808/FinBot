exports.handleChat = async (req, res) => {
    const { question } = req.body;
    const response = `🤖 You asked: "${question}". Here's a suggestion...`;
    res.json({ reply: response });
  };
  