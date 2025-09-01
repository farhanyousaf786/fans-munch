import React from 'react';
import { MdStar } from 'react-icons/md';
import './TestimonialsList.css';

const TestimonialsList = ({ testimonials }) => {
  if (!testimonials || testimonials.length === 0) return null;
  return (
    <div className="section">
      <h2 className="section-title">Testimonials</h2>
      <div className="testimonials-list">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="testimonial-item">
            <div className="testimonial-header">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <MdStar 
                    key={i} 
                    className={`star ${i < testimonial.rating ? 'filled' : 'empty'}`} 
                  />
                ))}
              </div>
              <span className="testimonial-date">
                {new Date(testimonial.createdAt?.toDate?.() || testimonial.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="testimonial-text">{testimonial.comment}</p>
            <p className="testimonial-author">- {testimonial.customerName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsList;
