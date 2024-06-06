import { Counter } from "../models/counter.model.js";

const getNextSequenceValue = async (sequenceName) => {
  const counter = await Counter.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

export { getNextSequenceValue };
