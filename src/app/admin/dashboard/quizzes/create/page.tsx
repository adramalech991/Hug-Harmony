"use client";

import QuizForm from "../QuizForm";
import { motion } from "framer-motion";

export default function CreateQuizPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto p-4 md:p-8"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-black">Create Certification Quiz</h1>
                <p className="text-muted-foreground mt-2">
                    Design a new knowledge assessment to certify professionals on the platform.
                </p>
            </div>

            <QuizForm />
        </motion.div>
    );
}
