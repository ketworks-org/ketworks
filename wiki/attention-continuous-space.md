# Attention in continuous space

> **In brief.** Electron attention builds permutation-equivariant features by letting each particle exchange information with the others. Psiformer uses these features to construct correlated orbitals; LapNet separates individual and interacting streams to reduce derivative work. Both retain determinants for antisymmetry and require coordinate derivatives for the kinetic energy.

Notation follows the [conventions page](../notation/).

## Electron tokens and permutation symmetry

An electron token encodes position and spin. Its sequence index is an arbitrary particle label, so an index-specific positional embedding would generally violate exchange symmetry. Physical coordinates are different: exchanging two electrons exchanges their coordinate features with them.

For a feature matrix $X$ whose rows are electrons, a conventional attention head is

$$
Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V,
\qquad
\mathcal A(X)=\operatorname{softmax}_{\mathrm{row}}
\left(\frac{QK^{\mathsf T}}{\sqrt{d_h}}\right)V,
$$

where $d_h$ is the query/key width. Under a row permutation $P$, queries, keys and values all acquire the same $P$. The attention matrix transforms as $A\mapsto PAP^{\mathsf T}$ and the output as $\mathcal A(PX)=P\mathcal A(X)$. Shared feed-forward layers and residual connections preserve this property. This is the algebra needed by the [neural-orbital construction](../neural-orbitals/).

## Psiformer

Psiformer embeds electron–nucleus vectors and distances together with the electron's spin. Rescaled distances control the growth of its inputs far from the nuclei. Repeated self-attention and smooth feed-forward updates produce features for orbitals with decaying envelopes. The state is a Jastrow factor times a sum of dense determinants:

$$
\Psi_\theta(\mathbf R)=e^{J_\theta(\mathbf R)}
\sum_{k=1}^{K_{\det}}\det\Phi^k_\theta(\mathbf R),
\qquad \Phi^k_\theta\in\mathbb R^{N\times N}.
$$

Unlike a product of separate spin determinants, each dense matrix has rows for all electrons; shared, spin-aware outputs preserve exchanges within each spin group. The construction does not impose an eigenvalue of total spin.

The attention stream omits explicit electron–electron distance inputs. A separate analytic Jastrow supplies their cusps; nuclear-distance features allow nuclear cusps to be learned (von Glehn, Spencer and Pfau, arXiv:2211.13672v2, Sec. III and Appendix A.2.1).

Attention here produces an unnormalized amplitude. It does not supply normalized conditional probabilities or independent autoregressive samples; see the distinction on the [transformer page](../transformer-wavefunctions/).

## LapNet: sparse derivatives with global attention

LapNet maintains individual features $\mathbf g_i$ and interacting features $\mathbf h_i$. The individual stream updates each electron independently using shared weights, so

$$
\frac{\partial\mathbf g_i}{\partial\mathbf r_j}=0
\quad(i\ne j),\qquad
\mathbf q_i=W_Q\mathbf g_i,\quad
\mathbf k_i=W_K\mathbf g_i,\quad
\mathbf v_i=W_V\mathbf h_i.
$$

Queries and keys therefore retain sparse coordinate derivatives while values carry accumulated correlations. The attentive stream still mixes all electrons. Sparsity here concerns derivatives, not a spatial cutoff on the attention graph. Final features produce enveloped orbitals, dense determinants and a cusp Jastrow (Li et al., arXiv:2307.08214v1, Sec. 4.3, Eqs. 25–34).

The accompanying Forward Laplacian framework propagates values, gradients and Laplacians through network operations. It is a differentiation method usable beyond LapNet; LapNet is an architecture designed to benefit from it (arXiv:2307.08214v1, Secs. 4.1–4.3).

## Why coordinate derivatives affect architecture

For a real wavefunction away from its nodes, write $\ell_\theta=\log|\Psi_\theta|$. In Hartree atomic units the kinetic local energy is

$$
T_{\mathrm{loc}}(\mathbf R)=
-\frac12\sum_i\left[
\nabla_i^2\ell_\theta+
\nabla_i\ell_\theta\cdot\nabla_i\ell_\theta
\right].
$$

Thus a cheap amplitude evaluation need not give a cheap energy evaluation. The elementary chain rule illustrates the extra work. For scalar $u(\mathbf R)$ and a smooth scalar function $f$,

$$
\nabla^2 f(u)=f'(u)\nabla^2u+
f''(u)\,\nabla u\cdot\nabla u.
$$

Mixed dependencies arise even in a product:

$$
\nabla^2(uv)=u\nabla^2v+v\nabla^2u+
2\nabla u\cdot\nabla v.
$$

If two intermediate features depend on disjoint coordinate sets, their gradient dot product vanishes. Mixing their inputs removes that simplification. Tracking which coordinates a feature depends on can therefore matter as much as counting its parameters.

Smooth activations support the needed second derivatives away from physical coalescences; replacing them with piecewise-linear functions changes the kinetic estimator. The [continuous-space introduction](../continuous-space/) treats cusps and sampling, and the [molecular benchmark page](../molecules/) fixes the systems on which energies can be compared. Timing comparisons must specify derivative evaluation, sampling and optimization work as well as network width and depth.

## References

- I. von Glehn, J. S. Spencer, D. Pfau, *A Self-Attention Ansatz for Ab-initio Quantum Chemistry*, arXiv:2211.13672v2 (2022). Psiformer, dense determinants and cusp treatment.
- R. Li et al., *Forward Laplacian: A New Computational Framework for Neural Network-based Variational Monte Carlo*, arXiv:2307.08214v1 (2023). Derivative propagation and LapNet's two attention streams.
